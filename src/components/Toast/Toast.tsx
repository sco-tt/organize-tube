import { useEffect, useState } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, show, onHide, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, onHide, duration]);

  if (!show) return null;

  return (
    <div className="toast">
      {message}
    </div>
  );
}