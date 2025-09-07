
import React from 'react';
import type { LearnedItem } from '../types';
import { CameraIcon, StopIcon, LightbulbIcon, TrashIcon, Spinner } from './icons';

interface ControlPanelProps {
  isCameraOn: boolean;
  onToggleCamera: () => void;
  newLabel: string;
  onLabelChange: (label: string) => void;
  onLearn: () => void;
  isLearning: boolean;
  isClassifying: boolean;
  learnedItems: LearnedItem[];
  onDeleteItem: (id: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isCameraOn,
  onToggleCamera,
  newLabel,
  onLabelChange,
  onLearn,
  isLearning,
  isClassifying,
  learnedItems,
  onDeleteItem
}) => {
  return (
    <div className="w-full h-full bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 flex flex-col shadow-2xl">
      <h2 className="text-2xl font-bold text-cyan-300 mb-4">Gemini Vision AI</h2>

      {/* Camera Control */}
      <button
        onClick={onToggleCamera}
        className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          isCameraOn 
            ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
            : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
        }`}
      >
        {isCameraOn ? <StopIcon className="w-5 h-5 mr-2" /> : <CameraIcon className="w-5 h-5 mr-2" />}
        <span>{isCameraOn ? 'Stop Camera' : 'Start Camera'}</span>
      </button>

      {/* Learning Section */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-200">Teach the AI</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Enter object name..."
            disabled={!isCameraOn}
            className="w-full bg-gray-900/80 border border-gray-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
          />
          <button
            onClick={onLearn}
            disabled={!isCameraOn || !newLabel || isLearning}
            className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
          >
            {isLearning ? (
              <Spinner className="w-5 h-5 mr-2" />
            ) : (
              <LightbulbIcon className="w-5 h-5 mr-2" />
            )}
            <span>{isLearning ? 'Learning...' : 'Learn Object'}</span>
          </button>
        </div>
      </div>
      
      {/* Learned Items Section */}
      <div className="mt-6 pt-6 border-t border-gray-700 flex-grow overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-200">Memory</h3>
            {isClassifying && (
                <div className="flex items-center text-sm text-cyan-400">
                    <Spinner className="w-4 h-4 mr-2" />
                    <span>Classifying...</span>
                </div>
            )}
        </div>
        {learnedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Teach the AI by pointing the camera at an object and giving it a name.</p>
          </div>
        ) : (
          <ul className="space-y-3 pr-2 -mr-2">
            {learnedItems.map(item => (
              <li key={item.id} className="bg-gray-900/80 rounded-lg p-3 flex items-center justify-between transition-all hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <img src={item.imageBase64} alt={item.label} className="w-12 h-12 rounded-md object-cover border-2 border-gray-600" />
                  <span className="font-medium text-gray-300">{item.label}</span>
                </div>
                <button 
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-700 transition-colors"
                  aria-label={`Delete ${item.label}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
