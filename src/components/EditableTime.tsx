import React, { useState, useRef, useEffect } from 'react';
import './EditableTime.css';

interface EditableTimeProps {
  timeInSeconds: number;
  onTimeChange: (newTimeInSeconds: number) => void;
  className?: string;
}

type TimeComponent = 'hours' | 'minutes' | 'seconds' | 'hundredths';

export function EditableTime({ timeInSeconds, onTimeChange, className = '' }: EditableTimeProps) {
  const [editingComponent, setEditingComponent] = useState<TimeComponent | null>(null);
  const [tempValue, setTempValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse time into components with better precision handling
  const totalHours = Math.floor(timeInSeconds / 3600);
  const totalMinutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  // Round to 2 decimal places first, then extract hundredths
  const roundedTime = Math.round(timeInSeconds * 100) / 100;
  const hundredths = Math.round((roundedTime % 1) * 100);

  // Determine if we need to show hours
  const showHours = timeInSeconds >= 3600;

  useEffect(() => {
    if (editingComponent && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingComponent]);

  const handleComponentClick = (component: TimeComponent) => {
    setEditingComponent(component);
    switch (component) {
      case 'hours':
        setTempValue(totalHours.toString());
        break;
      case 'minutes':
        setTempValue(totalMinutes.toString().padStart(2, '0'));
        break;
      case 'seconds':
        setTempValue(seconds.toString().padStart(2, '0'));
        break;
      case 'hundredths':
        // Ensure we get the exact hundredths value that's displayed
        const displayedHundredths = Math.max(0, Math.min(99, hundredths));
        setTempValue(displayedHundredths.toString().padStart(2, '0'));
        console.log('Hundredths clicked:', displayedHundredths, 'from time:', timeInSeconds);
        break;
    }
  };

  const handleInputChange = (value: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    // Limit length based on component type
    if (editingComponent === 'minutes' || editingComponent === 'seconds' || editingComponent === 'hundredths') {
      if (value.length <= 2) {
        setTempValue(value);
      }
    } else {
      // Hours can be longer
      setTempValue(value);
    }
  };

  const handleInputSubmit = () => {
    if (!editingComponent) return;

    let processedValue = tempValue;

    // Add leading zero for single digit minutes, seconds and hundredths
    if (editingComponent === 'minutes' || editingComponent === 'seconds' || editingComponent === 'hundredths') {
      if (processedValue.length === 1) {
        processedValue = '0' + processedValue;
      }
    }

    const numValue = parseInt(processedValue) || 0;
    let newHours = totalHours;
    let newMinutes = totalMinutes;
    let newSeconds = seconds;
    let newHundredths = hundredths;

    // Validate and apply the new value
    switch (editingComponent) {
      case 'hours':
        newHours = Math.max(0, numValue);
        break;
      case 'minutes':
        newMinutes = Math.max(0, Math.min(59, numValue));
        break;
      case 'seconds':
        newSeconds = Math.max(0, Math.min(59, numValue));
        break;
      case 'hundredths':
        newHundredths = Math.max(0, Math.min(99, numValue));
        break;
    }

    // Convert back to total seconds
    const newTimeInSeconds = newHours * 3600 + newMinutes * 60 + newSeconds + newHundredths / 100;
    onTimeChange(newTimeInSeconds);
    setEditingComponent(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setEditingComponent(null);
    }
  };

  const handleInputBlur = () => {
    handleInputSubmit();
  };

  return (
    <span className={`editable-time ${className}`}>
      {showHours && (
        <>
          {editingComponent === 'hours' ? (
            <input
              ref={inputRef}
              type="text"
              value={tempValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              className="time-input hours-input"
            />
          ) : (
            <span
              className="time-component hours"
              onClick={() => handleComponentClick('hours')}
            >
              {totalHours}
            </span>
          )}
          <span className="time-separator">:</span>
        </>
      )}
      {editingComponent === 'minutes' ? (
        <input
          ref={inputRef}
          type="text"
          value={tempValue}
          maxLength={2}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className="time-input minutes-input"
        />
      ) : (
        <span
          className="time-component minutes"
          onClick={() => handleComponentClick('minutes')}
        >
          {showHours ? totalMinutes.toString().padStart(2, '0') : totalMinutes}
        </span>
      )}
      <span className="time-separator">:</span>
      {editingComponent === 'seconds' ? (
        <input
          ref={inputRef}
          type="text"
          value={tempValue}
          maxLength={2}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className="time-input seconds-input"
        />
      ) : (
        <span
          className="time-component seconds"
          onClick={() => handleComponentClick('seconds')}
        >
          {seconds.toString().padStart(2, '0')}
        </span>
      )}
      <span className="time-separator">.</span>
      {editingComponent === 'hundredths' ? (
        <input
          ref={inputRef}
          type="text"
          value={tempValue}
          maxLength={2}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          className="time-input hundredths-input"
        />
      ) : (
        <span
          className="time-component hundredths"
          onClick={() => handleComponentClick('hundredths')}
        >
          {hundredths.toString().padStart(2, '0')}
        </span>
      )}
    </span>
  );
}