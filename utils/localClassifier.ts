// --- CONFIGURATION ---
// The number of bins for each color channel (R, G, B). Total bins = BINS^3.
const BINS = 8;
const TOTAL_BINS = BINS * BINS * BINS;

/**
 * A completely client-side image classifier that uses color histograms
 * to learn and recognize objects without any API calls.
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
   * This histogram serves as a "feature vector" or "fingerprint" for the image.
   * @param base64Image The base64 encoded image frame.
   * @returns A Promise resolving to a normalized histogram (number array).
   */
  public async generateHistogram(base64Image: string): Promise<number[]> {
    if (!this.ctx) return new Array(TOTAL_BINS).fill(0);

    const image = new Image();
    image.src = base64Image;
    await new Promise(resolve => { image.onload = resolve; });

    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);

    const imageData = this.ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    const histogram = new Array(TOTAL_BINS).fill(0);
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      // Ignore transparent or near-black pixels to focus on the object
      if (data[i + 3] < 128 || (data[i] < 10 && data[i+1] < 10 && data[i+2] < 10)) {
        continue;
      }

      const r = Math.floor(data[i] / (256 / BINS));
      const g = Math.floor(data[i + 1] / (256 / BINS));
      const b = Math.floor(data[i + 2] / (256 / BINS));
      
      const binIndex = r * BINS * BINS + g * BINS + b;
      histogram[binIndex]++;
      totalPixels++;
    }

    // Normalize the histogram
    if (totalPixels > 0) {
      for (let i = 0; i < TOTAL_BINS; i++) {
        histogram[i] /= totalPixels;
      }
    }

    return histogram;
  }

  /**
   * Compares two histograms using the histogram intersection method.
   * @param h1 The first histogram.
   * @param h2 The second histogram.
   * @returns A similarity score between 0 (completely different) and 1 (identical).
   */
  public compareHistograms(h1: number[], h2: number[]): number {
    let intersection = 0;
    for (let i = 0; i < TOTAL_BINS; i++) {
      intersection += Math.min(h1[i], h2[i]);
    }
    return intersection;
  }
}
