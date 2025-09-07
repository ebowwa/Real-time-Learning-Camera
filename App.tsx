import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import CameraFeed from './components/CameraFeed';
import type { CameraFeedHandle } from './components/CameraFeed';
import ControlPanel from './components/ControlPanel';
import type { LearnedItem, ClassificationResult } from './types';
import { MotionDetector } from './utils/motionDetector';

// --- CONFIGURATION ---
const MOTION_CHECK_INTERVAL = 1000; // Check for motion every second to avoid excessive API calls

// --- GEMINI SETUP ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [learnedItems, setLearnedItems] = useState<LearnedItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [currentClassification, setCurrentClassification] = useState<ClassificationResult>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  const cameraFeedRef = useRef<CameraFeedHandle>(null);
  // FIX: Use `number` for setInterval return type in browser environments instead of `NodeJS.Timeout`.
  const motionCheckIntervalRef = useRef<number | null>(null);
  const motionDetectorRef = useRef(new MotionDetector());
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
    setIsLearning(true);
    
    const imageBase64 = cameraFeedRef.current?.captureFrame();
    if (imageBase64) {
      const newItem: LearnedItem = {
        id: crypto.randomUUID(),
        label: newLabel.trim(),
        thumbnailBase64: imageBase64,
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
      const labels = learnedItems.map(item => item.label);
      const prompt = `Analyze the image. From the following list of items, which is the most prominent one in the image? List: [${labels.join(', ')}]. If none of the items are in the image, respond with "None". Respond with only the name of the item or "None".`;
      
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: frame.split(',')[1],
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, {text: prompt}] },
      });

      const resultText = response.text.trim();
      
      const matchedLabel = labels.find(l => l.toLowerCase() === resultText.toLowerCase());

      if (matchedLabel) {
        setCurrentClassification(matchedLabel);
      } else {
        setCurrentClassification(null);
      }

    } catch (error) {
      console.error("Error during classification:", error);
      setCurrentClassification(null);
    } finally {
      setIsClassifying(false);
    }
  }, [learnedItems]);

  const processFrame = useCallback(async () => {
    if (isProcessingFrameRef.current || isClassifying || !cameraFeedRef.current) return;
    isProcessingFrameRef.current = true;

    const frame = cameraFeedRef.current.captureFrame();
    if (frame) {
      const hasMotion = await motionDetectorRef.current.checkForMotion(frame);
      if (hasMotion) {
          runClassification(frame);
      }
    }
    isProcessingFrameRef.current = false;
  }, [runClassification, isClassifying]);


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
        />
      </aside>
    </div>
  );
}

export default App;