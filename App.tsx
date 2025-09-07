
import React, { useState, useRef, useCallback, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import type { CameraFeedHandle } from './components/CameraFeed';
import ControlPanel from './components/ControlPanel';
import { classifyImage } from './services/geminiService';
import type { LearnedItem } from './types';

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [learnedItems, setLearnedItems] = useState<LearnedItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isLearning, setIsLearning] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [currentClassification, setCurrentClassification] = useState('');

  const cameraFeedRef = useRef<CameraFeedHandle>(null);
  const classificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleCamera = () => {
    setIsCameraOn(prev => !prev);
    if (isCameraOn) {
        setCurrentClassification('');
    }
  };

  const handleLearn = async () => {
    if (!newLabel.trim()) return;
    setIsLearning(true);
    const imageBase64 = cameraFeedRef.current?.captureFrame();
    if (imageBase64) {
      const newItem: LearnedItem = {
        id: crypto.randomUUID(),
        label: newLabel.trim(),
        imageBase64,
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

  const runClassification = useCallback(async () => {
    if (isClassifying || learnedItems.length === 0) return;
    
    setIsClassifying(true);
    const frame = cameraFeedRef.current?.captureFrame();
    if (frame) {
      try {
        const result = await classifyImage(frame, learnedItems);
        setCurrentClassification(result);
      } catch (error) {
        console.error("Classification failed", error);
        setCurrentClassification("Error");
      }
    }
    setIsClassifying(false);
  }, [isClassifying, learnedItems]);


  useEffect(() => {
    if (isCameraOn && learnedItems.length > 0) {
      classificationIntervalRef.current = setInterval(runClassification, 2500);
    } else {
      if (classificationIntervalRef.current) {
        clearInterval(classificationIntervalRef.current);
      }
      setCurrentClassification('');
    }

    return () => {
      if (classificationIntervalRef.current) {
        clearInterval(classificationIntervalRef.current);
      }
    };
  }, [isCameraOn, learnedItems, runClassification]);


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
          isLearning={isLearning}
          isClassifying={isClassifying}
          learnedItems={learnedItems}
          onDeleteItem={handleDeleteItem}
        />
      </aside>
    </div>
  );
}

export default App;
