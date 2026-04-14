import { useState } from 'react';
import { LoopControls } from '../LoopControls';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import './SidebarTabs.css';

interface SidebarTabsProps {
  // Loop Controls props
  currentTime: number;
  activeLoop: any;
  loops: any[];
  isLooping: boolean;
  tempStart: number | null;
  tempEnd: number | null;
  onSetLoopStart: (time: number) => void;
  onSetLoopEnd: (time: number) => void;
  onToggleLoop: () => void;
  onSelectLoop: (loop: any) => void;
  onSaveLoop: (name: string, startTime: number, endTime: number) => void;
  onDeleteLoop: (id: string) => void;
  onClearTempPoints: () => void;
  onChangeTempStart?: (time: number) => void;
  onChangeTempEnd?: (time: number) => void;
}

export function SidebarTabs({
  currentTime,
  activeLoop,
  loops,
  isLooping,
  tempStart,
  tempEnd,
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onSelectLoop,
  onSaveLoop,
  onDeleteLoop,
  onClearTempPoints,
  onChangeTempStart,
  onChangeTempEnd
}: SidebarTabsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="sidebar-fixed">
      <div className="fixed-header">
        <h3>🎯 Segments</h3>
        <button
          className="config-button"
          title="Segment Settings"
          onClick={() => setIsSettingsOpen(true)}
        >
          ⚙️
        </button>
      </div>
      <div className="fixed-content">
        <LoopControls
          currentTime={currentTime}
          activeLoop={activeLoop}
          loops={loops}
          isLooping={isLooping}
          tempStart={tempStart}
          tempEnd={tempEnd}
          onSetLoopStart={onSetLoopStart}
          onSetLoopEnd={onSetLoopEnd}
          onToggleLoop={onToggleLoop}
          onSelectLoop={onSelectLoop}
          onSaveLoop={onSaveLoop}
          onDeleteLoop={onDeleteLoop}
          onClearTempPoints={onClearTempPoints}
          onChangeTempStart={onChangeTempStart}
          onChangeTempEnd={onChangeTempEnd}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}