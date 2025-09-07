// --- CONFIGURATION ---
// The number of bins for each color channel (R, G, B). Total bins = BINS^3.
const COLOR_BINS = 8;
const TOTAL_COLOR_BINS = COLOR_BINS * COLOR_BINS * COLOR_BINS;

/**
 * Generates a normalized color histogram from a base64 image.
 * This histogram serves as a "feature vector" or "fingerprint" for the image's color.
 * @param base64Image The base64 encoded image frame.
 * @returns A Promise resolving to a normalized histogram (number array).
 */
export async function generateColorHistogram(base64Image: string): Promise<number[]> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Array(TOTAL_COLOR_BINS).fill(0);

  const image = new Image();
  image.src = base64Image;
  await new Promise(resolve => { image.onload = resolve; });

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
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
