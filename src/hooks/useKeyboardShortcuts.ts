import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onToggleLoop: () => void;
  onTogglePlayPause: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
}

export function useKeyboardShortcuts({
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onTogglePlayPause,
  onSeekBackward,
  onSeekForward
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prevent default for our shortcuts
      const preventDefaultKeys = ['Space', 'KeyL', 'KeyS', 'KeyE', 'ArrowLeft', 'ArrowRight'];
      if (preventDefaultKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
          onTogglePlayPause();
          break;
        case 'KeyS':
          onSetLoopStart();
          break;
        case 'KeyE':
          onSetLoopEnd();
          break;
        case 'KeyL':
          onToggleLoop();
          break;
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            onSeekBackward();
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            onSeekForward();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSetLoopStart, onSetLoopEnd, onToggleLoop, onTogglePlayPause, onSeekBackward, onSeekForward]);
}

export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: 'Space',
  SET_LOOP_START: 'S',
  SET_LOOP_END: 'E',
  TOGGLE_LOOP: 'L',
  SEEK_BACKWARD: 'Ctrl/Cmd + ←',
  SEEK_FORWARD: 'Ctrl/Cmd + →'
} as const;