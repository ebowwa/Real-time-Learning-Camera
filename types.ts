export interface LearnedItem {
  id: string;
  label: string;
  /** A thumbnail for display purposes */
  thumbnailBase64: string;
  /** The feature vector (color histogram) for client-side comparison */
  histogram: number[];
}

/** The label of the classified object, or null if no match. */
export type ClassificationResult = string | null;
