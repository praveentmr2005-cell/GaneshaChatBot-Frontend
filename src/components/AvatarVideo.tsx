import React, { useEffect, useMemo, useRef } from 'react';

// It's good practice to handle asset imports so bundlers like Vite can process them.
// Make sure these paths are correct relative to this component's location.
import IdleVideoSrc from '../assets/Idle.mp4';
import SpeakingVideoSrc from '../assets/Speaking.mp4';

interface Props {
  isSpeaking: boolean;
  className?: string;
}

export default function AvatarVideo({ isSpeaking, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Memoize the video source to prevent unnecessary re-renders
  const src = useMemo(() => (isSpeaking ? SpeakingVideoSrc : IdleVideoSrc), [isSpeaking]);

  // Preload both videos when the component mounts to ensure a smooth transition
  useEffect(() => {
    const idleVideo = document.createElement('video');
    idleVideo.src = IdleVideoSrc;
    idleVideo.preload = 'auto';
    const speakingVideo = document.createElement('video');
    speakingVideo.src = SpeakingVideoSrc;
    speakingVideo.preload = 'auto';
    
    // Cleanup function to clear sources
    return () => {
      idleVideo.src = '';
      speakingVideo.src = '';
    };
  }, []);

  // Effect to handle video playback when the source changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Reset playback to the beginning when switching videos
    videoElement.currentTime = 0;
    const playPromise = videoElement.play();
    
    // Catch potential errors if autoplay is blocked by the browser
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch((error) => {
        console.log("Autoplay was prevented:", error);
      });
    }
  }, [src]);

  return (
    // The className passed from App.tsx will give this div h-full
    <div className={className}>
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        autoPlay
        // CRITICAL CLASSES:
        // w-full: Takes the full width of the parent.
        // h-full: Takes the full height of the parent.
        // object-cover: Fills the container, maintaining aspect ratio and cropping if necessary.
        className="w-full h-full rounded-xl shadow-lg object-cover"
      />
    </div>
  );
}
