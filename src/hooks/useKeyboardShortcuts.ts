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

    // Handle clicks to remove focus from YouTube iframe
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element;
      // If clicking outside the video player, blur any focused iframes
      if (!target.closest('.youtube-player-container')) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          if (iframe.contentWindow) {
            iframe.blur();
          }
        });
        // Ensure document has focus for keyboard shortcuts
        if (document.activeElement && document.activeElement !== document.body) {
          (document.activeElement as HTMLElement).blur();
        }
        document.body.focus();
      }
    };

    // Also add a periodic focus check to ensure shortcuts work
    const focusInterval = setInterval(() => {
      // If no specific element needs focus, ensure body has focus for shortcuts
      if (document.activeElement === document.documentElement ||
          (document.activeElement as HTMLElement)?.tagName === 'IFRAME') {
        document.body.focus();
      }
    }, 1000);

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('click', handleClick, true);
      clearInterval(focusInterval);
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