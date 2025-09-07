/** A key-value object where the key is the feature name (e.g., "color") and the value is its feature vector. */
export type FeatureSet = {
  [featureName: string]: number[];
};

export interface LearnedItem {
  id: string;
  label: string;
  /** A thumbnail for display purposes */
  thumbnailBase64: string;
  /** A collection of feature vectors that form the object's fingerprint. */
  features: FeatureSet;
}

/** The label of the classified object, or null if no match. */
export type ClassificationResult = string | null;

/** An object to hold the weight for each classification feature. */
export type FeatureWeights = {
  [key: string]: number;
};
