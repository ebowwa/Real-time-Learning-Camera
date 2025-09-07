import type { FeatureSet, FeatureWeights } from '../types';

/**
 * A generic, client-side classifier that compares objects based on a provided
 * set of feature vectors and their corresponding weights. It does not generate
 * features itself, but acts as a comparison engine.
 */
export class LocalClassifier {
  /**
   * Compares two feature sets using a weighted, normalized intersection method.
   * This method is dynamic and will work with any features provided in the weights object.
   * @param fs1 The FeatureSet of the first item.
   * @param fs2 The FeatureSet of the second item.
   * @param weights An object containing the weight for each feature (e.g., { color: 50, shape: 50 }).
   * @returns A combined similarity score between 0 and 1.
   */
  public compareFeatures(
    fs1: FeatureSet, 
    fs2: FeatureSet,
    weights: FeatureWeights
  ): number {
    const featureNames = Object.keys(weights);
    const totalWeight = featureNames.reduce((sum, name) => sum + (weights[name] || 0), 0);
    
    if (totalWeight === 0) return 0;

    let combinedScore = 0;

    for (const name of featureNames) {
      const v1 = fs1[name];
      const v2 = fs2[name];
      const weight = weights[name];

      if (!v1 || !v2 || !weight) continue;

      // Calculate the intersection (similarity) for the current feature vector
      let intersection = 0;
      const minLength = Math.min(v1.length, v2.length);
      for (let i = 0; i < minLength; i++) {
          intersection += Math.min(v1[i], v2[i]);
      }
      
      // Normalize the weight and add the weighted score to the total
      const normalizedWeight = weight / totalWeight;
      combinedScore += intersection * normalizedWeight;
    }
    
    return combinedScore;
  }
}
