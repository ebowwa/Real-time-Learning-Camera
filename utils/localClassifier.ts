import type { FeatureWeights } from '../types';

// --- CONFIGURATION ---
// The number of bins for each color channel (R, G, B). Total bins = BINS^3.
const COLOR_BINS = 8;
const TOTAL_COLOR_BINS = COLOR_BINS * COLOR_BINS * COLOR_BINS;

// The number of orientation bins for the HOG descriptor.
const HOG_ORIENTATION_BINS = 9;

/**
 * A completely client-side image classifier that uses a combination of
 * color histograms and Histogram of Oriented Gradients (HOG) to learn
 * and recognize objects without any API calls.
 */
export class LocalClassifier {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Generates a normalized color histogram from a base64 image.
   * This histogram serves as a "feature vector" or "fingerprint" for the image's color.
   * @param base64Image The base64 encoded image frame.
   * @returns A Promise resolving to a normalized histogram (number array).
   */
  public async generateHistogram(base64Image: string): Promise<number[]> {
    if (!this.ctx) return new Array(TOTAL_COLOR_BINS).fill(0);

    const image = new Image();
    image.src = base64Image;
    await new Promise(resolve => { image.onload = resolve; });

    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);

    const imageData = this.ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    const histogram = new Array(TOTAL_COLOR_BINS).fill(0);
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      // Ignore transparent or near-black pixels
      if (data[i + 3] < 128 || (data[i] < 10 && data[i+1] < 10 && data[i+2] < 10)) {
        continue;
      }

      const r = Math.floor(data[i] / (256 / COLOR_BINS));
      const g = Math.floor(data[i + 1] / (256 / COLOR_BINS));
      const b = Math.floor(data[i + 2] / (256 / COLOR_BINS));
      
      const binIndex = r * COLOR_BINS * COLOR_BINS + g * COLOR_BINS + b;
      histogram[binIndex]++;
      totalPixels++;
    }

    if (totalPixels > 0) {
      for (let i = 0; i < TOTAL_COLOR_BINS; i++) {
        histogram[i] /= totalPixels;
      }
    }

    return histogram;
  }

  /**
   * Generates a Histogram of Oriented Gradients (HOG) to capture shape and texture.
   * @param base64Image The base64 encoded image frame.
   * @returns A Promise resolving to a normalized HOG descriptor.
   */
  public async generateHOGDescriptor(base64Image: string): Promise<number[]> {
    if (!this.ctx) return new Array(HOG_ORIENTATION_BINS).fill(0);
    
    const image = new Image();
    image.src = base64Image;
    await new Promise(resolve => { image.onload = resolve; });
    
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    const width = image.width;
    const height = image.height;

    // Convert to grayscale
    const grayscaleData = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
        grayscaleData[i / 4] = avg;
    }

    const hogDescriptor = new Array(HOG_ORIENTATION_BINS).fill(0);
    let totalMagnitude = 0;
    
    const Gx_kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const Gy_kernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let Gx = 0;
            let Gy = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const pixelVal = grayscaleData[(y + ky) * width + (x + kx)];
                    Gx += pixelVal * Gx_kernel[ky + 1][kx + 1];
                    Gy += pixelVal * Gy_kernel[ky + 1][kx + 1];
                }
            }

            const magnitude = Math.sqrt(Gx*Gx + Gy*Gy);
            let angle = Math.atan2(Gy, Gx) * (180 / Math.PI); // angle in degrees
            if (angle < 0) {
                angle += 180; // Use unsigned orientation (0-180 degrees)
            }

            const bin = Math.min(HOG_ORIENTATION_BINS - 1, Math.floor(angle / (180 / HOG_ORIENTATION_BINS)));
            hogDescriptor[bin] += magnitude;
            totalMagnitude += magnitude;
        }
    }

    // Normalize the HOG descriptor
    if (totalMagnitude > 0) {
        for (let i = 0; i < HOG_ORIENTATION_BINS; i++) {
            hogDescriptor[i] /= totalMagnitude;
        }
    }
    
    return hogDescriptor;
  }

  /**
   * Compares two feature sets using a weighted, normalized intersection method.
   * @param f1 Features of the first item.
   * @param f2 Features of the second item.
   * @param weights An object containing the weight for each feature (e.g., { color: 50, shape: 50 }).
   * @returns A combined similarity score between 0 and 1.
   */
  public compareFeatures(
    f1: { histogram: number[], hogDescriptor: number[] }, 
    f2: { histogram: number[], hogDescriptor: number[] },
    weights: FeatureWeights
  ): number {
    const totalWeight = (weights.color || 0) + (weights.shape || 0);
    if (totalWeight === 0) return 0;

    const colorWeight = (weights.color || 0) / totalWeight;
    const hogWeight = (weights.shape || 0) / totalWeight;
    
    let colorIntersection = 0;
    for (let i = 0; i < f1.histogram.length; i++) {
        colorIntersection += Math.min(f1.histogram[i], f2.histogram[i]);
    }

    let hogIntersection = 0;
    for (let i = 0; i < f1.hogDescriptor.length; i++) {
        hogIntersection += Math.min(f1.hogDescriptor[i], f2.hogDescriptor[i]);
    }
    
    return (colorIntersection * colorWeight) + (hogIntersection * hogWeight);
  }
}
