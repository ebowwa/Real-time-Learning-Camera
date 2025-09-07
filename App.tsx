import React, { useState, useRef, useCallback, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import type { CameraFeedHandle } from './components/CameraFeed';
import ControlPanel from './components/ControlPanel';
import type { LearnedItem, ClassificationResult } from './types';
import { MotionDetector } from './utils/motionDetector';
import { LocalClassifier } from './utils/localClassifier';

// --- CONFIGURATION ---
const MOTION_CHECK_INTERVAL = 500; // Check for motion more frequently
const CLASSIFICATION_THRESHOLD = 0.6; // How similar histograms must be to be a match (0-1)

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [learnedItems, setLearnedItems] = useState<LearnedItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [currentClassification, setCurrentClassification] = useState<ClassificationResult>(null);

  const cameraFeedRef = useRef<CameraFeedHandle>(null);
  const motionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const motionDetectorRef = useRef(new MotionDetector());
  const classifierRef = useRef(new LocalClassifier());
  const isProcessingFrameRef = useRef(false);

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
    
    const imageBase64 = cameraFeedRef.current?.captureFrame();
    if (imageBase64) {
      const histogram = await classifierRef.current.generateHistogram(imageBase64);
      const newItem: LearnedItem = {
        id: crypto.randomUUID(),
        label: newLabel.trim(),
        thumbnailBase64: imageBase64,
        histogram,
      };
      setLearnedItems(prev => [...prev, newItem]);
      setNewLabel('');
    } else {
      alert("Failed to capture image from camera.");
    }
  };
  
  const handleDeleteItem = (id: string) => {
    setLearnedItems(prev => prev.filter(item => item.id !== id));
  };

  const runClassification = useCallback(async (frame: string) => {
    if (learnedItems.length === 0) {
      setCurrentClassification(null);
      return;
    }

    const frameHistogram = await classifierRef.current.generateHistogram(frame);
    let bestMatch: { label: string; score: number } | null = null;

    for (const item of learnedItems) {
      const score = classifierRef.current.compareHistograms(frameHistogram, item.histogram);
      if (score > (bestMatch?.score || 0)) {
        bestMatch = { label: item.label, score };
      }
    }
    
    if (bestMatch && bestMatch.score > CLASSIFICATION_THRESHOLD) {
      setCurrentClassification(bestMatch.label);
    } else {
      setCurrentClassification(null);
    }
  }, [learnedItems]);

  const processFrame = useCallback(async () => {
    if (isProcessingFrameRef.current || !cameraFeedRef.current) return;
    isProcessingFrameRef.current = true;

    const frame = cameraFeedRef.current.captureFrame();
    if (frame) {
      const hasMotion = await motionDetectorRef.current.checkForMotion(frame);
      if (hasMotion) {
          runClassification(frame);
      }
    }
    isProcessingFrameRef.current = false;
  }, [runClassification]);


  useEffect(() => {
    if (isCameraOn) {
      motionCheckIntervalRef.current = setInterval(processFrame, MOTION_CHECK_INTERVAL);
    } else {
      if (motionCheckIntervalRef.current) {
        clearInterval(motionCheckIntervalRef.current);
      }
      setCurrentClassification(null);
      motionDetectorRef.current.reset();
    }

    return () => {
      if (motionCheckIntervalRef.current) {
        clearInterval(motionCheckIntervalRef.current);
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
        />
      </main>
      <aside className="w-full lg:w-96 lg:h-full h-auto flex-shrink-0">
        <ControlPanel
          isCameraOn={isCameraOn}
          onToggleCamera={handleToggleCamera}
          newLabel={newLabel}
          onLabelChange={setNewLabel}
          onLearn={handleLearn}
          learnedItems={learnedItems}
          onDeleteItem={handleDeleteItem}
        />
      </aside>
    </div>
  );
}

export default App;
