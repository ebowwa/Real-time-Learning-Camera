
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
// FIX: Import CameraIcon to resolve reference error.
import { CameraIcon } from './icons';

interface CameraFeedProps {
  isCameraOn: boolean;
  classification: string;
}

export interface CameraFeedHandle {
  captureFrame: () => string | null;
}

const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(({ isCameraOn, classification }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (videoElement && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          videoElement.srcObject = stream;
          videoElement.play();
        } catch (err) {
          console.error("Error accessing camera:", err);
          alert("Could not access the camera. Please ensure permissions are granted and you are using a secure connection (https).");
        }
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };

    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraOn]);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === 4) {
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.8);
        }
      }
      return null;
    }
  }));

  const showClassification = classification && classification !== '...';

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl">
      <video ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} playsInline />
      <canvas ref={canvasRef} className="hidden" />
      
      {!isCameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <CameraIcon className="w-24 h-24 text-gray-600" />
          <p className="mt-4 text-lg text-gray-400">Camera is off</p>
        </div>
      )}
      
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ease-out ${showClassification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-black/50 backdrop-blur-md text-white font-bold text-2xl px-6 py-3 rounded-full shadow-lg border border-white/20">
          {classification}
        </div>
      </div>
    </div>
  );
});

export default CameraFeed;