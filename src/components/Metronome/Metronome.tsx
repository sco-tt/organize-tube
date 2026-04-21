import { useState, useRef, useCallback, useEffect } from 'react';
import './Metronome.css';

export interface MetronomeProps {
  className?: string;
}

export function Metronome({ className }: MetronomeProps) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(1);
  const [timeSignature, setTimeSignature] = useState(4);
  const [volume, setVolume] = useState(75);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const createBeepSound = useCallback(async (frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.type = 'sine';

    const volumeLevel = volume / 100;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(volumeLevel * 0.3, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  }, [volume]);

  const playBeat = useCallback(() => {
    // Update beat first, then play sound for that beat
    setBeat(prev => {
      const nextBeat = (prev % timeSignature) + 1;
      // Higher pitch for first beat, lower for others
      const frequency = nextBeat === 1 ? 800 : 400;
      createBeepSound(frequency, 0.1);
      return nextBeat;
    });
  }, [timeSignature, createBeepSound]);

  const toggleMetronome = useCallback(async () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
      setBeat(1);
    } else {
      // Initialize audio context on first user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setBeat(0); // Start at 0 so first playBeat() call sets it to 1

      // Play first beat immediately
      playBeat();

      const interval = 60000 / bpm; // Convert BPM to milliseconds
      intervalRef.current = setInterval(() => {
        playBeat();
      }, interval);

      setIsPlaying(true);
    }
  }, [isPlaying, bpm, playBeat]);

  // Update interval when BPM changes
  useEffect(() => {
    if (isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      const interval = 60000 / bpm;
      intervalRef.current = setInterval(() => {
        playBeat();
      }, interval);
    }
  }, [bpm, isPlaying, playBeat]);

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(Math.max(30, Math.min(300, newBpm)));
  }, []);

  const presetBpms = [60, 80, 100, 120, 140, 160];

  return (
    <div className={`metronome ${className || ''}`}>
      <div className="metronome-header">
        <h3>🎯 Metronome</h3>
      </div>

      <div className="metronome-controls">
        {/* BPM Display and Controls */}
        <div className="bpm-section">
          <div className="bpm-display">
            <span className="bpm-value">{bpm}</span>
            <span className="bpm-label">BPM</span>
          </div>

          <div className="bpm-controls">
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              className="bpm-btn"
              type="button"
            >
              -
            </button>
            <input
              type="range"
              min="30"
              max="300"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="bpm-slider"
            />
            <button
              onClick={() => handleBpmChange(bpm + 1)}
              className="bpm-btn"
              type="button"
            >
              +
            </button>
          </div>

          <div className="bpm-presets">
            {presetBpms.map(preset => (
              <button
                key={preset}
                onClick={() => setBpm(preset)}
                className={`preset-btn ${bpm === preset ? 'active' : ''}`}
                type="button"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Time Signature */}
        <div className="time-signature-section">
          <label>Time Signature:</label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(Number(e.target.value))}
            className="time-signature-select"
          >
            <option value={2}>2/4</option>
            <option value={3}>3/4</option>
            <option value={4}>4/4</option>
            <option value={5}>5/4</option>
            <option value={6}>6/8</option>
          </select>
        </div>

        {/* Beat Indicator */}
        <div className="beat-indicator">
          <div className="beat-dots">
            {Array.from({ length: timeSignature }, (_, i) => (
              <div
                key={i}
                className={`beat-dot ${i + 1 === beat && isPlaying ? 'active' : ''} ${i === 0 ? 'accent' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <div className="volume-section">
          <label>🔊 Volume:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-value">{volume}%</span>
        </div>

        {/* Play/Stop Button */}
        <button
          onClick={toggleMetronome}
          className={`metronome-toggle ${isPlaying ? 'playing' : ''}`}
          type="button"
        >
          {isPlaying ? '⏹️ Stop' : '▶️ Start'}
        </button>
      </div>
    </div>
  );
}