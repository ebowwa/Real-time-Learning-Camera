import React, { useState, useRef, useCallback, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import type { CameraFeedHandle } from './components/CameraFeed';
import ControlPanel from './components/ControlPanel';
import type { LearnedItem, ClassificationResult, FeatureWeights, FeatureSet } from './types';
import { MotionDetector } from './utils/motionDetector';
import { LocalClassifier } from './utils/localClassifier';
import { generateColorHistogram } from './utils/features/colorHistogram';
import { generateHOGDescriptor } from './utils/features/hogDescriptor';

// --- CONFIGURATION ---
const MOTION_CHECK_INTERVAL = 500; // Check for motion more frequently for better responsiveness.
const CLASSIFICATION_THRESHOLD = 0.60; // Similarity threshold for a match. Adjusted for new feature vector.

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [learnedItems, setLearnedItems] = useState<LearnedItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [currentClassification, setCurrentClassification] = useState<ClassificationResult>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [featureWeights, setFeatureWeights] = useState<FeatureWeights>({ color: 50, shape: 50 });

  const cameraFeedRef = useRef<CameraFeedHandle>(null);
  const motionCheckIntervalRef = useRef<number | null>(null);
  const motionDetectorRef = useRef(new MotionDetector());
  const isProcessingFrameRef = useRef(false);
  const classifierRef = useRef(new LocalClassifier());

  const handleToggleCamera = () => {
    const turningOff = isCameraOn;
    setIsCameraOn(prev => !prev);
    if (turningOff) {
      setCurrentClassification(null);
      motionDetectorRef.current.reset();
    }
  };

  const handleLearn = async () => {
    if (!newLabel.trim()) return;
    setIsLearning(true);
    
    const imageBase64 = cameraFeedRef.current?.captureFrame();
    if (imageBase64) {
      // Generate all features for the new object.
      const colorFeature = await generateColorHistogram(imageBase64);
      const shapeFeature = await generateHOGDescriptor(imageBase64);
      
      const newItem: LearnedItem = {
        id: crypto.randomUUID(),
        label: newLabel.trim(),
        thumbnailBase64: imageBase64,
        features: {
          color: colorFeature,
          shape: shapeFeature,
        },
      };
      setLearnedItems(prev => [...prev, newItem]);
      setNewLabel('');
    } else {
      alert("Failed to capture image from camera.");
    }
    setIsLearning(false);
  };
  
  const handleDeleteItem = (id: string) => {
    setLearnedItems(prev => prev.filter(item => item.id !== id));
  };

  const runClassification = useCallback(async (frame: string) => {
    if (learnedItems.length === 0) {
      setCurrentClassification(null);
      return;
    }
    setIsClassifying(true);
    try {
      // Generate features for the current camera frame.
      const currentColorFeature = await generateColorHistogram(frame);
      const currentShapeFeature = await generateHOGDescriptor(frame);
      const currentFeatures: FeatureSet = {
        color: currentColorFeature,
        shape: currentShapeFeature,
      };

      let bestMatch: LearnedItem | null = null;
      let bestScore = 0;

      for (const item of learnedItems) {
        const score = classifierRef.current.compareFeatures(currentFeatures, item.features, featureWeights);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = item;
        }
      }

      if (bestMatch && bestScore > CLASSIFICATION_THRESHOLD) {
        setCurrentClassification(bestMatch.label);
      } else {
        setCurrentClassification(null);
      }

    } catch (error) {
      console.error("Error during classification:", error);
      setCurrentClassification(null);
    } finally {
      setIsClassifying(false);
    }
  }, [learnedItems, featureWeights]);

  const processFrame = useCallback(async () => {
    if (isProcessingFrameRef.current || isClassifying || !cameraFeedRef.current) return;
    isProcessingFrameRef.current = true;

    const frame = cameraFeedRef.current.captureFrame();
    if (frame) {
      const hasMotion = await motionDetectorRef.current.checkForMotion(frame);
      if (hasMotion) {
          runClassification(frame);
      } else {
        if (currentClassification !== null) {
            setTimeout(() => setCurrentClassification(null), 500);
        }
      }
    }
    isProcessingFrameRef.current = false;
  }, [runClassification, isClassifying, currentClassification]);


  useEffect(() => {
    if (isCameraOn) {
      motionCheckIntervalRef.current = window.setInterval(processFrame, MOTION_CHECK_INTERVAL);
    } else {
      if (motionCheckIntervalRef.current) {
        window.clearInterval(motionCheckIntervalRef.current);
      }
      setCurrentClassification(null);
      motionDetectorRef.current.reset();
    }

    return () => {
      if (motionCheckIntervalRef.current) {
        window.clearInterval(motionCheckIntervalRef.current);
      }
    };
  }, [isCameraOn, processFrame]);


  return (
    <div className="w-screen h-screen p-4 sm:p-6 lg:p-8 bg-gray-900 flex flex-col lg:flex-row gap-6">
      <main className="flex-grow h-full lg:h-full w-full lg:w-auto">
        <CameraFeed 
            ref={cameraFeedRef} 
            isCameraOn={isCameraOn} 
            classification={currentClassification}
            isClassifying={isClassifying}
        />
      </main>
      <aside className="w-full lg:w-96 lg:h-full h-auto flex-shrink-0">
        <ControlPanel
          isCameraOn={isCameraOn}
          onToggleCamera={handleToggleCamera}
          newLabel={newLabel}
          onLabelChange={setNewLabel}
          onLearn={handleLearn}
          isLearning={isLearning}
          learnedItems={learnedItems}
          onDeleteItem={handleDeleteItem}
          featureWeights={featureWeights}
          onFeatureWeightsChange={setFeatureWeights}
        />
      </aside>
    </div>
  );
}

export default App;
