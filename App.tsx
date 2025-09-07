import React, { useState, useRef, useCallback, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import type { CameraFeedHandle } from './components/CameraFeed';
import ControlPanel from './components/ControlPanel';
import type { LearnedItem, ClassificationResult } from './types';
import { MotionDetector } from './utils/motionDetector';
import { LocalClassifier } from './utils/localClassifier';

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
  const [colorWeight, setColorWeight] = useState(0.5); // Default to a 50/50 balance

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
      const histogram = await classifierRef.current.generateHistogram(imageBase64);
      const hogDescriptor = await classifierRef.current.generateHOGDescriptor(imageBase64);
      const newItem: LearnedItem = {
        id: crypto.randomUUID(),
        label: newLabel.trim(),
        thumbnailBase64: imageBase64,
        histogram: histogram,
        hogDescriptor: hogDescriptor,
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
      const currentHistogram = await classifierRef.current.generateHistogram(frame);
      const currentHogDescriptor = await classifierRef.current.generateHOGDescriptor(frame);

      let bestMatch: LearnedItem | null = null;
      let bestScore = 0;
      
      const currentFeatures = { 
        histogram: currentHistogram, 
        hogDescriptor: currentHogDescriptor 
      };

      for (const item of learnedItems) {
        const itemFeatures = { 
            histogram: item.histogram, 
            hogDescriptor: item.hogDescriptor
        };
        const score = classifierRef.current.compareFeatures(currentFeatures, itemFeatures, colorWeight);
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
  }, [learnedItems, colorWeight]);

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
          colorWeight={colorWeight}
          onColorWeightChange={setColorWeight}
        />
      </aside>
    </div>
  );
}

export default App;