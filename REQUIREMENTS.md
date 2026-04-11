# YouTube Video Looper - Desktop App Requirements

## Project Overview
Building a desktop music practice tool similar to looper.tube that embeds YouTube videos and provides precise loop controls for musicians. The app allows users to:
- Embed YouTube videos in a distraction-free environment
- Adjust playback speed (especially slow down for practice)
- Set precise loop segments (e.g., 1:15 to 1:35) with frame-level accuracy
- Practice difficult passages by looping at custom speeds continuously
- Access the tool offline without browser distractions and ads

## Technology Stack

### Primary Choice: Tauri
- **Frontend**: React/Vue/Svelte (TBD based on team expertise)
- **Backend Core**: Rust (minimal knowledge required)
- **WebView**: Native OS WebView (Edge WebView2/WebKit/WebKitGTK)
- **Build Tool**: Tauri CLI
- **Package Manager**: npm/pnpm/bun (TBD)

### Fallback Choice: Electron
- **Frontend**: Same as above
- **Runtime**: Node.js + Chromium
- **Build Tool**: electron-builder
- **Optimization**: webpack-bundle-analyzer, code splitting

## Performance Requirements

### Install Size
- **Target**: < 15MB (Tauri) or < 100MB (Electron)
- **Maximum Acceptable**: 25MB (Tauri) or 150MB (Electron)

### Memory Usage
- **Target**: < 50MB RAM at idle
- **Maximum Acceptable**: < 100MB RAM at idle
- **Load Time**: < 2 seconds to show UI

### Platform Support
- **Primary**: macOS, Windows 10/11
- **Secondary**: Linux (Ubuntu/Fedora)

## Development Requirements

### Team Constraints
- [ ] JavaScript/TypeScript expertise level: ___
- [ ] Rust knowledge in team: Yes/No
- [ ] Willing to learn minimal Rust: Yes/No
- [ ] Timeline pressure: High/Medium/Low

### Development Environment
- Node.js 18+ (LTS)
- Rust 1.70+ (for Tauri)
- Platform-specific build tools:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio Build Tools, WebView2
  - **Linux**: webkit2gtk-4.0-dev, build-essential

### Build & Distribution
- Automated builds via GitHub Actions/CI
- Code signing for macOS/Windows
- Auto-update mechanism
- Multi-platform release artifacts

## Feature Requirements

### Core Video Looper Features
- [ ] **YouTube Video Embedding**: Reliable iframe embedding across all target platforms
- [ ] **Speed Controls**: Smooth playback speed adjustment (0.25x to 2.0x, focus on slower speeds)
- [ ] **Precise Loop Segments**: Set start/end times with frame-level precision
- [ ] **Continuous Looping**: Seamless loop playback without gaps or stutters
- [ ] **Time Display**: Current time, loop start/end indicators, duration display
- [ ] **Keyboard Shortcuts**: Space (play/pause), arrow keys (seek), custom hotkeys for loop points
- [ ] **URL Input**: Paste YouTube URLs and extract video ID
- [ ] **Loop Presets**: Save and load common practice segments per video

### Practice Structure Features
- [ ] **Song Routines**: Define practice sequences for individual songs (e.g., play at 0.8x, 0.9x, 1.0x speed)
- [ ] **Set Lists**: Create playlists of multiple videos/songs to play in sequence
- [ ] **Routine Execution**: Automatically progress through speed changes in song routines
- [ ] **Set List Modes**: Play songs as-is OR execute their defined routines
- [ ] **Progress Tracking**: Track completion of routine steps and set list progress
- [ ] **Auto-Advance**: Optional automatic progression to next song/routine step
- [ ] **Practice Session Management**: Start/pause/resume entire practice sessions
- [ ] **Practice Notes**: Free-form text area for ongoing practice observations and technique notes
- [ ] **Resource Links**: Attach links to sheet music, tabs, tutorials, backing tracks, etc.
- [ ] **Link Management**: Organize links by type (tab, reference, tutorial, audio) with custom titles

### Music Practice Workflow
- [ ] **Global Hotkeys**: Control playback even when app not focused (for instrument practice)
- [ ] **Quick Loop Setting**: Click-and-drag or hotkey-based loop point setting
- [ ] **Speed Memory**: Remember speed settings per video/loop segment
- [ ] **Practice Session Tracking**: Optional tracking of practice time per segment
- [ ] **Multiple Loops**: Ability to save multiple loop segments per video
- [ ] **Audio Focus**: Minimize audio conflicts with DAW software

### Data Storage & Management
- [ ] **SQLite Database**: Local SQLite database using tauri-plugin-sql for cross-platform storage
- [ ] **Routine Metadata**: Store video URL, source type, title, artist, practice steps, notes, and links
- [ ] **Temporary Sessions**: Handle unsaved routines when just slowing down videos
- [ ] **Set List Management**: Create, edit, delete, and organize multiple setlists
- [ ] **Import/Export**: Backup database file and export routines/setlists (JSON format)
- [ ] **Practice History**: Optional tracking of completed practice sessions
- [ ] **Search & Filter**: SQL queries for finding routines by title, artist, or custom tags
- [ ] **Schema Migrations**: Handle database schema updates for future features

## Data Structure Requirements

**Simplified Model**: Everything is a Song Routine. When you first load a YouTube video to slow it down, you're working with an unsaved/temporary routine. Once you save it (even with default settings), it becomes a persistent Song Routine that can be added to setlists.

**Workflow**:
1. Load YouTube URL → Creates temporary routine with default settings
2. Adjust speed, set loops, add notes → Still temporary
3. Save → Creates persistent Song Routine
4. Add to setlist → References the saved routine

## Storage Technology

### **SQLite with tauri-plugin-sql** (Selected)

**Rationale**: SQLite is the idiomatic choice for Tauri applications requiring structured data storage. It provides cross-platform compatibility, zero configuration, and is officially supported by the Tauri team.

**Benefits**:
- Official Tauri plugin with community support
- Cross-platform file storage (auto-handled by Tauri)
- ACID compliance and data integrity
- SQL queries for complex filtering and search
- No Rust knowledge required (JavaScript/TypeScript interface)
- Easy backup (single .db file)
- Schema migrations for future feature additions

**Database File Locations**:
- **macOS**: `~/Library/Application Support/com.yourapp.name/database.db`
- **Windows**: `%APPDATA%\com.yourapp.name\database.db`
- **Linux**: `~/.config/com.yourapp.name/database.db`

## JavaScript/TypeScript Architecture

### **Frontend Stack: React + TypeScript**

**Rationale**: React provides mature component ecosystem for video controls and complex UI state. TypeScript ensures type safety across the Rust/JavaScript boundary and complex data structures.

### **Project Structure**
```
src/
├── components/
│   ├── VideoPlayer/           # YouTube iframe wrapper with controls
│   │   ├── VideoPlayer.tsx
│   │   ├── SpeedControl.tsx
│   │   ├── LoopControl.tsx
│   │   └── TimeDisplay.tsx
│   ├── RoutineBuilder/        # Practice routine creation/editing
│   │   ├── RoutineBuilder.tsx
│   │   ├── StepsEditor.tsx
│   │   ├── LoopEditor.tsx
│   │   └── NotesEditor.tsx
│   ├── SetListManager/        # Setlist creation and playback
│   │   ├── SetListView.tsx
│   │   ├── SetListPlayer.tsx
│   │   └── PlaybackQueue.tsx
│   └── Layout/                # App shell and navigation
├── hooks/
│   ├── useVideoPlayer.ts      # YouTube player control logic
│   ├── useRoutines.ts         # Database operations for routines
│   ├── useSetLists.ts         # Database operations for setlists
│   ├── usePracticeSession.ts  # Active practice session state
│   └── useGlobalHotkeys.ts    # Keyboard shortcut handling
├── services/
│   ├── databaseService.ts     # SQLite operations wrapper
│   ├── youtubeService.ts      # YouTube URL parsing and metadata
│   └── exportService.ts       # Import/export functionality
├── types/
│   ├── routine.types.ts       # Song routine interfaces
│   ├── setlist.types.ts       # Set list interfaces
│   └── player.types.ts        # Video player interfaces
├── utils/
│   ├── timeFormat.ts          # Time display utilities
│   ├── urlValidation.ts       # URL parsing and validation
│   └── keyboardShortcuts.ts   # Hotkey definitions
└── App.tsx
```

### **TypeScript Interfaces**

```typescript
// types/routine.types.ts
export interface SongRoutine {
  id: string;
  url: string;
  urlSource: 'youtube' | 'vimeo' | 'local';
  title: string;
  artist: string;
  duration: number;
  name: string;
  tags: string[];
  loops: LoopSegment[];
  steps: PracticeStep[];
  notes: string;
  freeformNotes: string;
  links: ResourceLink[];
  createdAt: string;
  lastPracticed?: string;
}

export interface LoopSegment {
  name: string;
  startTime: number;
  endTime: number;
  defaultSpeed: number;
}

export interface PracticeStep {
  speed: number;
  repetitions?: number;
  loopSegment?: string; // null = full song
}

export interface ResourceLink {
  title: string;
  url: string;
  type: 'tab' | 'reference' | 'tutorial' | 'audio';
}

// types/setlist.types.ts
export interface SetList {
  id: string;
  name: string;
  description: string;
  items: SetListItem[];
  createdAt: string;
  estimatedDuration: number;
}

export interface SetListItem {
  routineId: string;
  playMode: 'routine' | 'single';
  order: number;
}

// types/player.types.ts
export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  activeLoop?: LoopSegment;
  isLooping: boolean;
}
```

### **Service Layer Pattern**

```typescript
// services/databaseService.ts
import Database from 'tauri-plugin-sql-api';
import { SongRoutine, SetList } from '../types';

class DatabaseService {
  private db: Database | null = null;

  async initialize() {
    this.db = await Database.load('sqlite:database.db');
    await this.runMigrations();
  }

  async createRoutine(routine: Omit<SongRoutine, 'id' | 'createdAt'>): Promise<SongRoutine> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await this.db!.execute(`
      INSERT INTO song_routines (
        id, url, url_source, title, artist, duration, name,
        tags_json, loops_json, steps_json, notes, freeform_notes, links_json, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      id, routine.url, routine.urlSource, routine.title, routine.artist,
      routine.duration, routine.name, JSON.stringify(routine.tags),
      JSON.stringify(routine.loops), JSON.stringify(routine.steps),
      routine.notes, routine.freeformNotes, JSON.stringify(routine.links), createdAt
    ]);

    return { ...routine, id, createdAt };
  }

  async getAllRoutines(): Promise<SongRoutine[]> {
    const rows = await this.db!.select('SELECT * FROM song_routines ORDER BY last_practiced DESC');
    return rows.map(this.mapRoutineFromDb);
  }

  async searchRoutines(query: string): Promise<SongRoutine[]> {
    const rows = await this.db!.select(`
      SELECT * FROM song_routines
      WHERE title LIKE $1 OR artist LIKE $1
      ORDER BY last_practiced DESC
    `, [`%${query}%`]);
    return rows.map(this.mapRoutineFromDb);
  }

  private mapRoutineFromDb(row: any): SongRoutine {
    return {
      ...row,
      tags: JSON.parse(row.tags_json || '[]'),
      loops: JSON.parse(row.loops_json || '[]'),
      steps: JSON.parse(row.steps_json || '[]'),
      links: JSON.parse(row.links_json || '[]'),
    };
  }
}

export const databaseService = new DatabaseService();
```

### **Custom Hooks for Domain Logic**

```typescript
// hooks/useVideoPlayer.ts
import { useState, useRef, useCallback } from 'react';
import { VideoPlayerState, LoopSegment } from '../types';

export function useVideoPlayer() {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1.0,
    isLooping: false,
  });

  const playerRef = useRef<any>(null);

  const setSpeed = useCallback(async (speed: number) => {
    if (playerRef.current) {
      await playerRef.current.setPlaybackRate(speed);
      setState(prev => ({ ...prev, speed }));
    }
  }, []);

  const setLoop = useCallback((loop: LoopSegment | undefined) => {
    setState(prev => ({
      ...prev,
      activeLoop: loop,
      isLooping: !!loop
    }));

    if (loop && playerRef.current) {
      playerRef.current.seekTo(loop.startTime);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!playerRef.current) return;

    if (state.isPlaying) {
      await playerRef.current.pauseVideo();
    } else {
      await playerRef.current.playVideo();
    }
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying]);

  return {
    state,
    playerRef,
    setSpeed,
    setLoop,
    togglePlayPause,
    seek: (time: number) => playerRef.current?.seekTo(time),
  };
}

// hooks/useRoutines.ts
import { useState, useEffect } from 'react';
import { SongRoutine } from '../types';
import { databaseService } from '../services/databaseService';

export function useRoutines() {
  const [routines, setRoutines] = useState<SongRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getAllRoutines();
      setRoutines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routines');
    } finally {
      setLoading(false);
    }
  };

  const createRoutine = async (routine: Omit<SongRoutine, 'id' | 'createdAt'>) => {
    try {
      const newRoutine = await databaseService.createRoutine(routine);
      setRoutines(prev => [newRoutine, ...prev]);
      return newRoutine;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create routine');
      throw err;
    }
  };

  const searchRoutines = async (query: string) => {
    try {
      setLoading(true);
      const results = await databaseService.searchRoutines(query);
      setRoutines(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    routines,
    loading,
    error,
    createRoutine,
    searchRoutines,
    refetch: loadRoutines,
  };
}

// hooks/usePracticeSession.ts
import { useState, useCallback } from 'react';
import { SongRoutine, PracticeStep } from '../types';

interface PracticeSessionState {
  routine: SongRoutine | null;
  currentStep: number;
  stepProgress: number; // repetitions completed
  isActive: boolean;
}

export function usePracticeSession() {
  const [session, setSession] = useState<PracticeSessionState>({
    routine: null,
    currentStep: 0,
    stepProgress: 0,
    isActive: false,
  });

  const startSession = useCallback((routine: SongRoutine) => {
    setSession({
      routine,
      currentStep: 0,
      stepProgress: 0,
      isActive: true,
    });
  }, []);

  const nextStep = useCallback(() => {
    setSession(prev => {
      if (!prev.routine || prev.currentStep >= prev.routine.steps.length - 1) {
        return { ...prev, isActive: false }; // Session complete
      }
      return {
        ...prev,
        currentStep: prev.currentStep + 1,
        stepProgress: 0,
      };
    });
  }, []);

  const completeRepetition = useCallback(() => {
    setSession(prev => {
      if (!prev.routine) return prev;

      const currentStep = prev.routine.steps[prev.currentStep];
      const newProgress = prev.stepProgress + 1;

      if (currentStep.repetitions && newProgress >= currentStep.repetitions) {
        // Auto-advance to next step
        return prev.currentStep >= prev.routine.steps.length - 1
          ? { ...prev, isActive: false } // Session complete
          : { ...prev, currentStep: prev.currentStep + 1, stepProgress: 0 };
      }

      return { ...prev, stepProgress: newProgress };
    });
  }, []);

  return {
    session,
    startSession,
    nextStep,
    completeRepetition,
    endSession: () => setSession(prev => ({ ...prev, isActive: false })),
  };
}
```

### **Component Architecture**

```typescript
// components/VideoPlayer/VideoPlayer.tsx
import React, { useEffect } from 'react';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { SongRoutine } from '../../types';
import { SpeedControl } from './SpeedControl';
import { LoopControl } from './LoopControl';

interface VideoPlayerProps {
  routine: SongRoutine;
  onTimeUpdate?: (time: number) => void;
}

export function VideoPlayer({ routine, onTimeUpdate }: VideoPlayerProps) {
  const { state, playerRef, setSpeed, setLoop, togglePlayPause } = useVideoPlayer();

  useEffect(() => {
    // Initialize YouTube player iframe
    // Handle time updates for loop detection
  }, [routine.url]);

  return (
    <div className="video-player">
      <div className="video-container">
        <iframe
          ref={playerRef}
          src={`https://www.youtube.com/embed/${extractVideoId(routine.url)}`}
          title={routine.title}
        />
      </div>

      <div className="controls">
        <SpeedControl
          currentSpeed={state.speed}
          onSpeedChange={setSpeed}
        />
        <LoopControl
          loops={routine.loops}
          activeLoop={state.activeLoop}
          onLoopSelect={setLoop}
        />
      </div>
    </div>
  );
}
```

### **Error Handling Strategy**

```typescript
// utils/errorHandling.ts
export class VideoLooperError extends Error {
  constructor(
    message: string,
    public type: 'database' | 'youtube' | 'validation' | 'network',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'VideoLooperError';
  }
}

export function handleDatabaseError(error: any): never {
  if (error.message?.includes('UNIQUE constraint')) {
    throw new VideoLooperError('A routine with this URL already exists', 'database', error);
  }
  throw new VideoLooperError('Database operation failed', 'database', error);
}

export function handleYouTubeError(error: any): never {
  if (error.message?.includes('embedding disabled')) {
    throw new VideoLooperError('This video cannot be embedded', 'youtube', error);
  }
  throw new VideoLooperError('YouTube player error', 'youtube', error);
}
```

### **Global State Management**

```typescript
// App.tsx - Simple context for global state
const AppContext = React.createContext<{
  currentRoutine: SongRoutine | null;
  setCurrentRoutine: (routine: SongRoutine | null) => void;
} | null>(null);

export function App() {
  const [currentRoutine, setCurrentRoutine] = useState<SongRoutine | null>(null);

  return (
    <AppContext.Provider value={{ currentRoutine, setCurrentRoutine }}>
      <Router>
        {/* App routes */}
      </Router>
    </AppContext.Provider>
  );
}
```

**Key Principles:**
- **Type-first development** with strict TypeScript
- **Single responsibility** hooks for each domain concern
- **Error boundaries** around video and database operations
- **Optimistic updates** for responsive UI
- **Service layer** abstraction over Tauri commands

### Song Routine Entity (Primary)
```json
{
  "id": "routine-id",
  "url": "https://youtube.com/watch?v=...",
  "urlSource": "youtube", // "youtube", "vimeo", "local", etc.
  "title": "Song Title", // auto-extracted or user-edited
  "artist": "Artist Name", // user-entered
  "duration": 240, // seconds, auto-detected
  "name": "Standard Practice Routine", // user-defined routine name
  "tags": ["guitar", "intermediate"],
  "loops": [
    {
      "name": "Verse 1",
      "startTime": 75.5, // seconds
      "endTime": 95.2,
      "defaultSpeed": 0.8
    },
    {
      "name": "Chorus",
      "startTime": 95.2,
      "endTime": 110.0,
      "defaultSpeed": 0.9
    }
  ],
  "steps": [
    {
      "speed": 0.8,
      "repetitions": 3, // optional
      "loopSegment": "Verse 1" // optional, uses whole song if null
    },
    {
      "speed": 0.9,
      "repetitions": 2,
      "loopSegment": "Chorus"
    },
    {
      "speed": 1.0,
      "repetitions": 1
      // no loopSegment = full song
    }
  ],
  "notes": "Focus on fingering accuracy at slow speed. Watch for clean chord transitions in measures 3-4.",
  "freeformNotes": "2024-03-15: Still struggling with the F chord transition. Try alternate fingering.\n2024-03-18: Much better! Ready to increase tempo.\n\nTechnique reminders:\n- Keep thumb behind neck\n- Use fingertips only\n- Practice chord changes separately",
  "links": [
    {
      "title": "Guitar Tab",
      "url": "https://ultimate-guitar.com/tab/...",
      "type": "tab"
    },
    {
      "title": "Chord Chart",
      "url": "https://example.com/chords.pdf",
      "type": "reference"
    },
    {
      "title": "Technique Tutorial",
      "url": "https://youtube.com/watch?v=...",
      "type": "tutorial"
    },
    {
      "title": "Backing Track",
      "url": "https://soundcloud.com/...",
      "type": "audio"
    }
  ],
  "createdAt": "ISO date",
  "lastPracticed": "ISO date"
}
```

### Set List Entity
```json
{
  "id": "setlist-id",
  "name": "Practice Session 1",
  "description": "Weekly practice routine",
  "items": [
    {
      "routineId": "routine-id",
      "playMode": "routine", // "routine" = execute practice steps, "single" = play once at normal speed
      "order": 1
    },
    {
      "routineId": "another-routine-id",
      "playMode": "single", // just play the video normally
      "order": 2
    }
  ],
  "createdAt": "ISO date",
  "estimatedDuration": 1800 // seconds, calculated from routines and play modes
}
```

## Database Schema

### **SQLite Tables**

```sql
-- Song Routines table
CREATE TABLE song_routines (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  url_source TEXT NOT NULL DEFAULT 'youtube', -- 'youtube', 'vimeo', 'local', etc.
  title TEXT,
  artist TEXT,
  duration INTEGER, -- seconds
  name TEXT,
  tags_json TEXT, -- JSON array: ["guitar", "intermediate"]
  loops_json TEXT, -- JSON array of loop objects
  steps_json TEXT, -- JSON array of practice steps
  notes TEXT, -- short practice notes
  freeform_notes TEXT, -- detailed practice journal
  links_json TEXT, -- JSON array of resource links
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_practiced TIMESTAMP
);

-- Set Lists table
CREATE TABLE set_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  items_json TEXT, -- JSON array with routineId and playMode
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estimated_duration INTEGER -- seconds
);

-- Indexes for performance
CREATE INDEX idx_routines_artist ON song_routines(artist);
CREATE INDEX idx_routines_title ON song_routines(title);
CREATE INDEX idx_routines_url_source ON song_routines(url_source);
CREATE INDEX idx_routines_last_practiced ON song_routines(last_practiced);
```

### **URL Source Flexibility**

The `url_source` field enables future expansion beyond YouTube:
- `"youtube"` - YouTube videos
- `"vimeo"` - Vimeo videos
- `"local"` - Local video files
- `"soundcloud"` - Audio-only practice tracks
- `"bandcamp"` - Artist tracks
- `"custom"` - Other video platforms

### **JSON Field Examples**

```sql
-- tags_json example
'["guitar", "intermediate", "blues", "fingerpicking"]'

-- loops_json example
'[{"name":"Verse 1","startTime":75.5,"endTime":95.2,"defaultSpeed":0.8}]'

-- steps_json example
'[{"speed":0.8,"repetitions":3,"loopSegment":"Verse 1"}]'

-- items_json (setlist) example
'[{"routineId":"routine-123","playMode":"routine","order":1}]'

-- links_json example
'[{"title":"Guitar Tab","url":"https://ultimate-guitar.com/...","type":"tab"}]'
```

### **JavaScript Integration**

```javascript
import Database from "tauri-plugin-sql-api";

// Initialize database
const db = await Database.load("sqlite:database.db");

// Create routine
await db.execute(`
  INSERT INTO song_routines (id, url, url_source, title, artist, steps_json)
  VALUES ($1, $2, $3, $4, $5, $6)
`, [id, url, urlSource, title, artist, JSON.stringify(steps)]);

// Query routines by source
const youtubeRoutines = await db.select(`
  SELECT * FROM song_routines WHERE url_source = 'youtube'
`);

// Search routines
const searchResults = await db.select(`
  SELECT * FROM song_routines
  WHERE artist LIKE $1 OR title LIKE $1
  ORDER BY last_practiced DESC
`, [`%${searchTerm}%`]);
```

### Advanced Features (Evaluate Tauri Support)
- [ ] **Video Download**: Offline practice capability (legal/ToS considerations)
- [ ] **Audio Isolation**: Isolate specific audio channels if available
- [ ] **MIDI Integration**: Control via MIDI foot pedals or controllers
- [ ] **Plugin System**: Extensions for specific instruments (guitar tabs overlay, etc.)
- [ ] **Sync with Metronome**: Optional click track overlay
- [ ] **Export Loops**: Export practice segments as audio files

## Security Requirements
- [ ] Sandboxed execution
- [ ] Secure communication between frontend/backend
- [ ] Protection against XSS/injection attacks
- [ ] Code obfuscation (if needed)
- [ ] Update signature verification

## Tauri Evaluation Blockers

### Video Playback Specific Blockers
- [ ] **YouTube iframe Compatibility**: Does YouTube Player API work consistently across WebView2/WebKit/WebKitGTK?
- [ ] **Video Timing Precision**: Can we achieve frame-level accuracy for loop points across all WebViews?
- [ ] **Performance with Video**: Does video playback performance match Chromium-based solutions?
- [ ] **YouTube API Limitations**: Any restrictions on iframe embedding in native WebViews?
- [ ] **Speed Control Accuracy**: Smooth speed changes without audio artifacts across platforms?

### Music Practice Workflow Blockers
- [ ] **Global Hotkeys**: Can Tauri handle system-wide keyboard shortcuts for practice sessions?
- [ ] **Audio Routing**: Integration with system audio when running alongside DAW software?
- [ ] **Background Playback**: Continued playback when app loses focus during practice?
- [ ] **Media Keys**: Support for keyboard media keys (play/pause/skip)?
- [ ] **Window Management**: Always-on-top mode for practice sessions?

### Storage & Data Management Blockers
- [ ] **SQLite Plugin Stability**: Is tauri-plugin-sql stable and well-maintained for production use?
- [ ] **Database Performance**: Do SQLite operations maintain responsiveness during video playback?
- [ ] **Cross-Platform Consistency**: Identical database behavior across WebView implementations?
- [ ] **Migration Handling**: Smooth schema updates as features are added?
- [ ] **JSON Performance**: Efficient serialization/deserialization of complex nested structures?
- [ ] **Concurrent Access**: Handle multiple operations without blocking video controls?

### Technical Integration Blockers
- [ ] **YouTube Player API**: Full JavaScript API access for programmatic control?
- [ ] **Auto-Advance Logic**: Reliable progression through routines and setlists?
- [ ] **URL Handling**: Register as handler for YouTube URLs (optional)?
- [ ] **Performance Overhead**: Memory usage acceptable when running with music software?
- [ ] **Cross-Platform Consistency**: Identical behavior across macOS/Windows/Linux WebViews?

### Development & Ecosystem Blockers
- [ ] **Video Processing Libraries**: Need for libraries like FFmpeg (if adding offline features)?
- [ ] **Rapid Iteration**: Fast development cycle for UI tweaks and timing adjustments?
- [ ] **Debugging Video Issues**: Adequate tools for debugging video playback problems?
- [ ] **Third-party Integrations**: Future needs for music software APIs or plugins?

## Decision Matrix

| Criteria | Tauri | Electron | Weight | Notes |
|----------|-------|----------|---------|-------|
| Install Size | ⭐⭐⭐⭐⭐ | ⭐⭐ | High | 10MB vs 150MB |
| Memory Usage | ⭐⭐⭐⭐⭐ | ⭐⭐ | High | 30MB vs 200MB |
| Development Speed | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium | Learning curve vs immediate |
| Ecosystem | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium | Growing vs mature |
| Security | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | Rust safety vs JS vulnerabilities |
| Platform Support | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | High | Good vs excellent |

## Implementation Plan

### Phase 1: Core Video Embedding (1-2 weeks)
1. Set up Tauri project with React/Vue frontend
2. Implement YouTube iframe embedding and basic controls
3. Test YouTube Player API integration across target platforms
4. Verify video playback performance and timing accuracy
5. Evaluate WebView compatibility with YouTube's iframe restrictions

**Success Criteria**: Can embed and control YouTube videos reliably on all target platforms

### Phase 2: Loop Controls (2-3 weeks)
1. Implement precise time selection UI (start/end point setting)
2. Build continuous loop functionality with seamless transitions
3. Add speed control with smooth audio/video adjustment
4. Create keyboard shortcuts for common actions
5. Test timing precision and loop performance

**Success Criteria**: Can set precise loop segments and play continuously at custom speeds

### Phase 3: Data Storage & Structure (1-2 weeks)
1. Design and implement local database schema (songs, routines, setlists)
2. Build song management UI (add, edit, organize songs)
3. Create routine builder (define practice speed sequences)
4. Implement setlist management (create, edit, organize playlists)
5. Add import/export functionality for backup/sharing

**Success Criteria**: Can create and manage complex practice structures

### Phase 4: Practice Workflow Automation (1-2 weeks)
1. Build routine execution engine (auto-progress through speeds)
2. Implement setlist player (sequential song/routine playback)
3. Add global hotkeys for background practice sessions
4. Create practice session management (start/pause/resume)
5. Add progress tracking and completion indicators

**Success Criteria**: Automated practice workflows work smoothly

### Phase 5: Polish & Distribution (1-2 weeks)
1. Performance optimization and memory usage analysis
2. Cross-platform testing and WebView consistency validation
3. Build automation setup with code signing
4. Auto-update mechanism implementation
5. User testing with musicians for feedback on complete workflow

## Fallback Trigger Points

Switch to Electron if:
- Critical blocker discovered in Phase 1
- Performance targets not achievable with Tauri
- Development timeline cannot accommodate Rust learning
- Essential npm packages incompatible with Tauri

## Success Metrics

### Performance Metrics
- [ ] Install size under target (<15MB Tauri, <100MB Electron)
- [ ] Memory usage under 100MB while playing video
- [ ] App startup time under 2 seconds
- [ ] Video load time under 3 seconds for YouTube embed
- [ ] Loop transition gaps under 100ms
- [ ] Smooth 60fps UI during video playback

### Music Practice Metrics
- [ ] Frame-level accuracy for loop points (±33ms at 30fps)
- [ ] Speed adjustment range 0.25x - 2.0x with smooth audio
- [ ] Global hotkeys respond within 50ms
- [ ] Can practice continuously for 30+ minutes without issues
- [ ] Works reliably alongside DAW software (Logic, Pro Tools, etc.)

### Platform Consistency
- [ ] Identical loop timing accuracy across macOS/Windows/Linux
- [ ] Consistent YouTube iframe behavior across WebViews
- [ ] Same keyboard shortcuts work on all platforms
- [ ] Visual consistency in video rendering

### User Experience Metrics
- [ ] Can set loop points in under 5 seconds
- [ ] Intuitive for musicians without technical background
- [ ] No audio dropouts or glitches during speed changes
- [ ] Reliable loop presets save/load functionality

## Resources & Documentation

### Tauri Resources
- [Tauri Documentation](https://tauri.app/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)

### Performance Tools
- Chrome DevTools (for WebView debugging)
- Tauri DevTools
- Bundle size analyzers
- Memory profilers

---

**Decision Date**: TBD
**Review Date**: After Phase 1 completion
**Final Technology Choice**: TBD based on blocker evaluation