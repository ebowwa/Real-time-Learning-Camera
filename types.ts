export interface LearnedItem {
  id: string;
  label: string;
  /** A thumbnail for display purposes */
  thumbnailBase64: string;
  /** A color histogram used as a feature vector for classification. */
  histogram: number[];
  /** A Histogram of Oriented Gradients (HOG) for texture and shape analysis. */
  hogDescriptor: number[];
}

/** The label of the classified object, or null if no match. */
export type ClassificationResult = string | null;