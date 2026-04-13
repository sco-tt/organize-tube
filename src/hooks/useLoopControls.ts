import { useState, useCallback, useRef, useEffect } from 'react';
import { LoopSegment } from '../types/loops';
import { YouTubePlayerHandle } from '../components/YouTubePlayer';

interface UseLoopControlsProps {
  playerRef: React.RefObject<YouTubePlayerHandle>;
  isPlaying: boolean;
}

export function useLoopControls({ playerRef, isPlaying }: UseLoopControlsProps) {
  const [loops, setLoops] = useState<LoopSegment[]>([]);
  const [activeLoop, setActiveLoop] = useState<LoopSegment | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [tempStart, setTempStart] = useState<number | null>(null);
  const [tempEnd, setTempEnd] = useState<number | null>(null);

  const loopCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const seekCooldownRef = useRef<boolean>(false);

  // Clear loop checking when loop is disabled or player stops
  useEffect(() => {
    if (!isLooping || !isPlaying || !activeLoop) {
      if (loopCheckIntervalRef.current) {
        clearInterval(loopCheckIntervalRef.current);
        loopCheckIntervalRef.current = null;
      }
      return;
    }

    // Set up loop checking interval
    loopCheckIntervalRef.current = setInterval(() => {
      if (playerRef.current && activeLoop && isLooping && isPlaying && !seekCooldownRef.current) {
        try {
          const current = playerRef.current.getCurrentTime();

          // Check if we've passed the end time (with small buffer for precision)
          if (current >= activeLoop.endTime - 0.1) {
            console.log(`Loop reached end at ${current.toFixed(2)}s, seeking back to ${activeLoop.startTime.toFixed(2)}s`);

            // Set cooldown to prevent rapid seeking
            seekCooldownRef.current = true;

            playerRef.current.seekTo(activeLoop.startTime);
            lastSeekTimeRef.current = Date.now();

            // Clear cooldown after a short delay
            setTimeout(() => {
              seekCooldownRef.current = false;
            }, 300);
          }

          // Also check if we've somehow gone outside the loop bounds
          if (current < activeLoop.startTime - 1 || current > activeLoop.endTime + 1) {
            console.log(`Player outside loop bounds (${current.toFixed(2)}s), seeking to start`);
            playerRef.current.seekTo(activeLoop.startTime);
          }
        } catch (error) {
          console.warn('Error in loop checking:', error);
        }
      }
    }, 50); // Check every 50ms for better precision

    return () => {
      if (loopCheckIntervalRef.current) {
        clearInterval(loopCheckIntervalRef.current);
      }
    };
  }, [isLooping, isPlaying, activeLoop, playerRef]);

  const setLoopStart = useCallback((time: number) => {
    setTempStart(time);
  }, []);

  const setLoopEnd = useCallback((time: number) => {
    setTempEnd(time);
  }, []);

  const saveLoop = useCallback((name: string, startTime: number, endTime: number) => {
    const newLoop: LoopSegment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      startTime,
      endTime,
      isActive: false
    };

    setLoops(prev => [...prev, newLoop]);
    setTempStart(null);
    setTempEnd(null);
  }, []);

  const deleteLoop = useCallback((loopId: string) => {
    setLoops(prev => prev.filter(loop => loop.id !== loopId));

    // If we're deleting the active loop, clear it
    if (activeLoop?.id === loopId) {
      setActiveLoop(null);
      setIsLooping(false);
    }
  }, [activeLoop]);

  const selectLoop = useCallback((loop: LoopSegment | null) => {
    setActiveLoop(loop);

    // If selecting a loop, seek to its start
    if (loop && playerRef.current) {
      playerRef.current.seekTo(loop.startTime);
    }
  }, [playerRef]);

  const toggleLooping = useCallback(() => {
    // Check if we have either an active loop OR temp start/end points
    if (!activeLoop && (tempStart === null || tempEnd === null)) {
      alert('Please set loop start (S) and end (E) points first');
      return;
    }

    // If we have temp points but no active loop, create a temporary active loop
    if (!activeLoop && tempStart !== null && tempEnd !== null) {
      const tempLoop: LoopSegment = {
        id: 'temp-loop',
        name: `Temp Loop ${tempStart.toFixed(0)}s-${tempEnd.toFixed(0)}s`,
        startTime: tempStart,
        endTime: tempEnd,
        isActive: true
      };
      setActiveLoop(tempLoop);
    }

    setIsLooping(prev => {
      const newLooping = !prev;

      // If starting to loop, seek to loop start
      if (newLooping && playerRef.current) {
        const loopToUse = activeLoop || { startTime: tempStart!, endTime: tempEnd! };
        playerRef.current.seekTo(loopToUse.startTime);
        lastSeekTimeRef.current = Date.now();
      }

      return newLooping;
    });
  }, [activeLoop, tempStart, tempEnd, playerRef]);

  const clearLoops = useCallback(() => {
    setLoops([]);
    setActiveLoop(null);
    setIsLooping(false);
    setTempStart(null);
    setTempEnd(null);
  }, []);

  const clearTempPoints = useCallback(() => {
    setTempStart(null);
    setTempEnd(null);
  }, []);

  const changeTempStart = useCallback((time: number) => {
    setTempStart(time);
  }, []);

  const changeTempEnd = useCallback((time: number) => {
    setTempEnd(time);
  }, []);

  return {
    loops,
    activeLoop,
    isLooping,
    tempStart,
    tempEnd,
    setLoopStart,
    setLoopEnd,
    saveLoop,
    deleteLoop,
    selectLoop,
    toggleLooping,
    clearLoops,
    clearTempPoints,
    changeTempStart,
    changeTempEnd
  };
}