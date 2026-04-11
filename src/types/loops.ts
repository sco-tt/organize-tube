export interface LoopSegment {
  id: string;
  name: string;
  startTime: number; // seconds
  endTime: number;   // seconds
  isActive: boolean;
}

export interface LoopState {
  segments: LoopSegment[];
  activeSegmentId: string | null;
  isLooping: boolean;
  tempStart: number | null; // For setting loop points
  tempEnd: number | null;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: LoopState;
}