// Constants for motion detection can be configured here.
const DEFAULT_MOTION_CANVAS_SIZE = 32;
const DEFAULT_MOTION_THRESHOLD = 10; // Sensitivity: lower means more sensitive

/**
 * A class to detect motion between video frames.
 * It works by comparing downsized, grayscale versions of frames
 * to efficiently determine if a significant change has occurred.
 */
export class MotionDetector {
  private size: number;
  private threshold: number;
  private previousFrameData: ImageData | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor(size = DEFAULT_MOTION_CANVAS_SIZE, threshold = DEFAULT_MOTION_THRESHOLD) {
    this.size = size;
    this.threshold = threshold;
    
    // Create an offscreen canvas for processing frames without rendering them to the DOM.
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Processes a base64 image string into downscaled, grayscale image data.
   * @param frame The base64 encoded image frame.
   * @returns A Promise that resolves to ImageData or null if context is not available.
   */
  private async getGrayscaleImageData(frame: string): Promise<ImageData | null> {
    if (!this.ctx) return null;

    const image = new Image();
    image.src = frame;
    // Wait for the image to load before processing.
    await new Promise(resolve => { image.onload = resolve; });

    // Draw the image onto the small canvas to scale it down.
    this.ctx.drawImage(image, 0, 0, this.size, this.size);
    const frameData = this.ctx.getImageData(0, 0, this.size, this.size);
    
    // Convert the image to grayscale for simpler comparison.
    for (let i = 0; i < frameData.data.length; i += 4) {
        const avg = (frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3;
        frameData.data[i] = frameData.data[i + 1] = frameData.data[i + 2] = avg; // R, G, B to average
    }
    return frameData;
  }

  /**
   * Compares the current frame with the previous one to detect motion.
   * @param frame The base64 encoded image frame to check.
   * @returns A Promise that resolves to `true` if motion is detected, `false` otherwise.
   */
  public async checkForMotion(frame: string): Promise<boolean> {
    const currentFrameData = await this.getGrayscaleImageData(frame);
    if (!currentFrameData) return false;

    let hasMotion = false;
    if (this.previousFrameData) {
        let diff = 0;
        // Calculate the absolute difference of pixel values between frames.
        for (let i = 0; i < currentFrameData.data.length; i += 4) {
            diff += Math.abs(currentFrameData.data[i] - this.previousFrameData.data[i]);
        }
        // If the average difference per pixel exceeds the threshold, we have motion.
        if (diff / (currentFrameData.data.length / 4) > this.threshold) {
            hasMotion = true;
        }
    } else {
        // If this is the first frame, assume there is motion to get an initial classification.
        hasMotion = true;
    }

    this.previousFrameData = currentFrameData;
    return hasMotion;
  }
  
  /**
   * Resets the motion detector's memory of the previous frame.
   * This should be called when the camera stops or the context changes.
   */
  public reset() {
    this.previousFrameData = null;
  }
}
