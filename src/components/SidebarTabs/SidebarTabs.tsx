import React, { useState } from 'react';
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
  onSetLoopStart: (time: number) => void;
  onSetLoopEnd: (time: number) => void;
  onToggleLoop: () => void;
  onSelectLoop: (loop: any) => void;
  onSaveLoop: (name: string) => void;
  onDeleteLoop: (id: string) => void;

  // Sets Sidebar props
  onVideoSelect: (videoId: string) => void;
}

export function SidebarTabs({
  currentTime,
  activeLoop,
  loops,
  isLooping,
  onSetLoopStart,
  onSetLoopEnd,
  onToggleLoop,
  onSelectLoop,
  onSaveLoop,
  onDeleteLoop,
  onVideoSelect
}: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('loops');

  return (
    <div className="sidebar-tabs">
      <div className="tab-header">
        <button
          className={`tab-button ${activeTab === 'loops' ? 'active' : ''}`}
          onClick={() => setActiveTab('loops')}
        >
          🔁 Loop Controls
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
            onSetLoopStart={onSetLoopStart}
            onSetLoopEnd={onSetLoopEnd}
            onToggleLoop={onToggleLoop}
            onSelectLoop={onSelectLoop}
            onSaveLoop={onSaveLoop}
            onDeleteLoop={onDeleteLoop}
          />
        )}

        {activeTab === 'sets' && (
          <SetsSidebar onVideoSelect={onVideoSelect} />
        )}
      </div>
    </div>
  );
}