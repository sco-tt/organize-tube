export interface LoopSegment {
  id: string;
  song_routine_id?: string;
  name: string;
  start_time: number; // seconds
  end_time: number;   // seconds
  default_speed: number;
  created_at: string;
  order_index: number;
  // Backward compatibility properties (computed)
  startTime?: number; // alias for start_time
  endTime?: number;   // alias for end_time
  isActive?: boolean; // computed property
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