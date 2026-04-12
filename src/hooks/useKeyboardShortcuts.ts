import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onSetLoopStart: () => void;
  onSetLoopEnd: () => void;
  onToggleLoop: () => void;
  onTogglePlayPause: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts({
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onTogglePlayPause,
  onSeekBackward,
  onSeekForward,
  onShowHelp
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Don't trigger when modals are open
      if (document.querySelector('.modal')) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle shortcuts
      switch (key) {
        case ' ':
          event.preventDefault();
          event.stopPropagation();
          onTogglePlayPause();
          break;
        case 's':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            onSetLoopStart();
          }
          break;
        case 'e':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            onSetLoopEnd();
          }
          break;
        case 'r':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            onToggleLoop();
          }
          break;
        case 'arrowleft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            onSeekBackward();
          }
          break;
        case 'arrowright':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            onSeekForward();
          }
          break;
        case '?':
          if (onShowHelp) {
            event.preventDefault();
            event.stopPropagation();
            onShowHelp();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onSetLoopStart, onSetLoopEnd, onToggleLoop, onTogglePlayPause, onSeekBackward, onSeekForward, onShowHelp]);
}

export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: 'Space',
  SET_LOOP_START: 'S',
  SET_LOOP_END: 'E',
  TOGGLE_LOOP: 'R',
  SEEK_BACKWARD: 'Ctrl/Cmd + ←',
  SEEK_FORWARD: 'Ctrl/Cmd + →',
  HELP: 'Shift + ?'
} as const;