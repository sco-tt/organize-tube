import React, { useState, useEffect } from 'react';
import { LoopControls } from '../LoopControls';
import { SetsSidebar } from '../SetsSidebar';
import './SidebarTabs.css';

type SidebarTab = 'loops' | 'sets';

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

  // Sets Sidebar props
  onVideoSelect: (videoId: string) => void;
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
  onChangeTempEnd,
  onVideoSelect
}: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('loops');

  // Auto-switch to loops tab when temp points are set or loops are created
  useEffect(() => {
    if (tempStart !== null || tempEnd !== null || loops.length > 0) {
      setActiveTab('loops');
    }
  }, [tempStart, tempEnd, loops.length]);

  return (
    <div className="sidebar-tabs">
      <div className="tab-header">
        <button
          className={`tab-button ${activeTab === 'loops' ? 'active' : ''}`}
          onClick={() => setActiveTab('loops')}
        >
          🎯 Segments
        </button>
        <button
          className={`tab-button ${activeTab === 'sets' ? 'active' : ''}`}
          onClick={() => setActiveTab('sets')}
        >
          📋 Practice Sets
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'loops' && (
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
        )}

        {activeTab === 'sets' && (
          <SetsSidebar onVideoSelect={onVideoSelect} />
        )}
      </div>
    </div>
  );
}