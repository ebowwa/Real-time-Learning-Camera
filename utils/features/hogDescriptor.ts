// --- CONFIGURATION ---
// The number of orientation bins for the HOG descriptor.
const HOG_ORIENTATION_BINS = 9;

/**
 * Generates a Histogram of Oriented Gradients (HOG) to capture shape and texture.
 * @param base64Image The base64 encoded image frame.
 * @returns A Promise resolving to a normalized HOG descriptor.
 */
export async function generateHOGDescriptor(base64Image: string): Promise<number[]> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Array(HOG_ORIENTATION_BINS).fill(0);
  
  const image = new Image();
  image.src = base64Image;
  await new Promise(resolve => { image.onload = resolve; });
  
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
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
