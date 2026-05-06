# MP3 Uploads Feature Plan

## Overview
Allow users to upload their own MP3 files to practice with, expanding beyond YouTube videos to include local audio content, backing tracks, and personal recordings.

## Core Feature Description
Users can drag-and-drop or browse to select MP3 files from their computer. These files are then loaded into the same practice interface as YouTube videos, with identical looping, speed control, and practice routine functionality.

## User Stories

### Primary Use Cases
- **Musician with backing tracks**: Upload MP3 backing tracks to practice solos and parts
- **Student with lesson recordings**: Upload audio from private lessons or masterclasses
- **Band member with demos**: Upload rough recordings to learn new songs
- **Multi-instrumentalist**: Upload isolated instrument tracks for focused practice
- **Producer with stems**: Upload individual track stems (drums, bass, guitar, vocals) for detailed practice
- **Music teacher**: Upload separated tracks to help students focus on specific instruments

### Secondary Use Cases
- **Offline practice**: Use the app without internet connectivity
- **Custom audio**: Upload metronome tracks, click tracks, or custom practice loops
- **Audio from other sources**: Content from CDs, Bandcamp, personal recordings

## Technical Implementation

### File Handling
```typescript
interface AudioFile {
  id: string;
  filename: string;
  filePath: string; // Local file system path
  duration: number;
  fileSize: number;
  uploadedAt: string;
  lastModified: string;
}

interface AudioTrack {
  id: string;
  audioFileId: string;
  trackName: string;        // e.g., "Drums", "Bass", "Guitar"
  trackType: 'full' | 'stem'; // Single file or part of multi-track
  stemGroupId?: string;     // Groups stems that belong together
  order: number;           // Display order in mixer
  isMuted: boolean;
  volume: number;          // Individual track volume (0-100)
  panBalance: number;      // Stereo pan (-100 to +100)
}

interface StemGroup {
  id: string;
  name: string;            // e.g., "Hotel California Stems"
  tracks: AudioTrack[];
  masterVolume: number;
  createdAt: string;
}
```

### Storage Strategy
- **Local Storage**: Files stored in app's data directory using Tauri filesystem APIs
- **Database**: File metadata stored in SQLite with same schema as YouTube videos
- **Cleanup**: Automatic cleanup of orphaned files when songs are deleted

### Audio Player Integration
- **Web Audio API**: Use same player interface as YouTube iframe
- **HTML5 Audio**: Fallback for unsupported formats
- **Waveform Display**: Optional visual waveform for precise loop point setting

## User Interface Design

### Upload Interface
```
┌─────────────────────────────────────────┐
│ 📁 Upload MP3 File(s)                   │
├─────────────────────────────────────────┤
│ ☐ Upload multiple tracks (stems/parts)  │
│                                         │
│     🎵 Drag & Drop MP3 files here      │
│           or click to browse           │
│                                         │
│ Supported: MP3, M4A, WAV, OGG          │
│ Max size: 100MB per file               │
└─────────────────────────────────────────┘

// When "multiple tracks" is checked:
┌─────────────────────────────────────────┐
│ 📁 Upload Multiple Tracks               │
├─────────────────────────────────────────┤
│ ☑ Upload multiple tracks (stems/parts)  │
│                                         │
│ Song/Project Name: [________________]   │
│                                         │
│     🎵 Drop multiple MP3 files here    │
│        (drums, bass, guitar, etc.)     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🥁 drums.mp3        [Rename] [×]    │ │
│ │ 🎸 guitar.mp3       [Rename] [×]    │ │
│ │ 🎤 vocals.mp3       [Rename] [×]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Add More Files] [Upload All]           │
└─────────────────────────────────────────┘
```

### File Management
- **My Files Tab**: New sidebar tab showing uploaded audio files
- **File Details**: Filename, duration, file size, upload date
- **Quick Actions**: Play, Practice, Edit, Delete
- **Search & Filter**: Search by filename, filter by duration/date

### Audio Player

#### Single Track Mode
- **Same Interface**: Identical controls as YouTube player (speed, volume, loops)
- **Waveform**: Optional waveform visualization for precise timing
- **Metadata**: Display filename and basic audio properties

#### Multi-Track Mode (Stems)
```
┌─────────────────────────────────────────┐
│ 🎵 Hotel California Stems              │
│                                         │
│ Master: [████████████] 85%  [🔇]       │
│                                         │
│ 🥁 Drums   [████████████] 80% [🔇] [S] │
│ 🎸 Guitar  [████████████] 90% [🔇] [S] │
│ 🎤 Vocals  [██████      ] 65% [🔇] [S] │
│ 🎹 Keys    [████████████] 75% [🔇] [S] │
│                                         │
│ ⏯️ [██████████████████████] 2:15/4:32  │
│ Speed: 0.8x  Loop: 1:15-2:30           │
└─────────────────────────────────────────┘
```
- **Individual Controls**: Volume, mute, solo for each track
- **Master Volume**: Overall mix control
- **Solo Mode**: Play only selected tracks
- **Track Groups**: Visual grouping of related instruments

## Database Schema Extensions

### New Tables
```sql
-- Store local audio file information
CREATE TABLE audio_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration REAL NOT NULL,
  file_size INTEGER NOT NULL,
  file_format TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group stems that belong together
CREATE TABLE stem_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  master_volume INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual tracks within a stem group or standalone
CREATE TABLE audio_tracks (
  id TEXT PRIMARY KEY,
  audio_file_id TEXT NOT NULL,
  stem_group_id TEXT,           -- NULL for single files
  track_name TEXT NOT NULL,     -- e.g., "Drums", "Guitar"
  track_type TEXT CHECK (track_type IN ('full', 'stem')) DEFAULT 'full',
  display_order INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT FALSE,
  volume INTEGER DEFAULT 100,
  pan_balance INTEGER DEFAULT 0,  -- -100 to +100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audio_file_id) REFERENCES audio_files(id) ON DELETE CASCADE,
  FOREIGN KEY (stem_group_id) REFERENCES stem_groups(id) ON DELETE CASCADE
);

-- Link audio tracks to song routines (replaces single audio_file_id)
ALTER TABLE song_routines ADD COLUMN stem_group_id TEXT;
ALTER TABLE song_routines ADD COLUMN audio_track_id TEXT; -- For single files
ALTER TABLE song_routines ADD COLUMN url_source CHECK (url_source IN ('youtube', 'vimeo', 'local', 'stems'));
```

### Migration Strategy
```sql
-- Migration: Add audio file support
UPDATE song_routines SET url_source = 'youtube' WHERE url_source IS NULL;
```

## File System Management

### Directory Structure
```
app_data/
├── audio_files/
│   ├── single/              # Single track files
│   │   ├── {uuid}.mp3
│   │   └── {uuid}.m4a
│   └── stems/               # Multi-track stem groups
│       ├── {group_id}/
│       │   ├── drums_{uuid}.mp3
│       │   ├── bass_{uuid}.mp3
│       │   ├── guitar_{uuid}.mp3
│       │   └── vocals_{uuid}.mp3
│       └── {group_id}/
└── waveforms/               # Generated waveform visualizations
    ├── single/
    │   └── {uuid}.png
    └── stems/
        └── {group_id}/
            ├── drums_{uuid}.png
            └── guitar_{uuid}.png
```

### File Operations (Tauri Commands)
```rust
// Single file operations
#[tauri::command]
async fn upload_single_audio_file(file_path: String) -> Result<AudioTrackInfo, String>

// Multi-track operations
#[tauri::command]
async fn upload_stem_group(
    group_name: String, 
    file_paths: Vec<String>, 
    track_names: Vec<String>
) -> Result<StemGroupInfo, String>

#[tauri::command]
async fn add_track_to_stem_group(
    group_id: String, 
    file_path: String, 
    track_name: String
) -> Result<AudioTrackInfo, String>

#[tauri::command]
async fn update_track_settings(
    track_id: String,
    volume: Option<i32>,
    is_muted: Option<bool>,
    pan_balance: Option<i32>
) -> Result<(), String>

#[tauri::command]
async fn delete_stem_group(group_id: String) -> Result<(), String>

#[tauri::command]
async fn delete_audio_track(track_id: String) -> Result<(), String>

#[tauri::command]
async fn get_stem_group_paths(group_id: String) -> Result<Vec<String>, String>
```

## Security & Validation

### File Validation
- **Format Check**: Validate file headers, not just extensions
- **Size Limits**: 100MB per file, 1GB total storage
- **Audio Verification**: Ensure files are actually playable audio
- **Sanitization**: Clean filenames for safe storage

### Privacy
- **Local Only**: Files never leave the user's machine
- **No Telemetry**: No tracking of uploaded content
- **User Control**: Easy bulk deletion and cleanup tools

## User Experience Flow

### Single File Upload Flow
1. **Select Files**: Drag-drop or file browser (checkbox unchecked)
2. **Validation**: Check format, size, audio validity
3. **Processing**: Copy to app directory, extract metadata
4. **Database**: Save file info and create song routine
5. **Ready**: File appears in "My Files" tab

### Multi-Track Upload Flow
1. **Enable Multi-Track**: Check "Upload multiple tracks" checkbox
2. **Project Setup**: Enter project/song name
3. **Add Files**: Drag-drop multiple files or browse
4. **Track Naming**: Auto-detect or manually set track names (drums, guitar, etc.)
5. **Validation**: Verify all files are same length ± 2 seconds
6. **Processing**: Copy files to grouped directory structure
7. **Database**: Create stem group with linked tracks
8. **Ready**: Stem group appears in "My Files" with mixer interface

### Practice Flow
#### Single Track
1. **Select Audio**: Choose from uploaded files
2. **Load Player**: Same interface as YouTube videos
3. **Practice**: Set loops, adjust speed, save routines
4. **Organize**: Tag, annotate, create setlists

#### Multi-Track (Stems)
1. **Select Stem Group**: Choose from uploaded multi-track projects
2. **Load Mixer**: Multi-track player with individual controls
3. **Mix Practice**: 
   - Mute drums to practice along
   - Solo guitar to learn parts
   - Adjust individual track volumes
4. **Practice Routines**: Same loop and speed controls apply to all tracks
5. **Save Settings**: Mixer state saved with practice routines

## Multi-Track Stem Features

### Core Multi-Track Functionality
- **Grouped Upload**: Upload multiple related audio files as a single project
- **Individual Control**: Separate volume, mute, and solo controls for each track
- **Synchronized Playback**: All tracks play in perfect sync with shared timing
- **Mix Presets**: Save and recall different mixing configurations
- **Practice Modes**: 
  - **Minus One**: Mute your instrument to play along
  - **Isolation**: Solo specific instruments to learn parts
  - **Layer Building**: Gradually add tracks while practicing

### Audio Synchronization
- **Length Validation**: Ensure all tracks are the same duration (±2 second tolerance)
- **Sample Rate Matching**: Auto-detect and warn about mismatched sample rates
- **Latency Compensation**: Minimize audio latency for tight synchronization
- **Crossfade**: Smooth transitions when toggling tracks during playback

### Mixing Interface
```
Track Controls:
[🥁] Drums     [████████████] 85% [🔇] [S] [🎧]
[🎸] Guitar    [████████████] 90% [🔇] [S] [🎧]
[🎤] Vocals    [██████      ] 65% [🔇] [S] [🎧]
[🎹] Keys      [████████████] 75% [🔇] [S] [🎧]

🔇 = Mute  |  S = Solo  |  🎧 = Monitor/Preview
```

### Practice Scenarios
- **Drum Practice**: Mute drums, play along with bass/guitar/vocals
- **Guitar Learning**: Solo guitar track, then gradually add other instruments
- **Vocal Training**: Mute vocals, sing along with backing tracks
- **Arrangement Study**: Toggle instruments to understand song structure
- **Sectional Practice**: Practice specific instrument combinations

## Advanced Features (Future)

### Audio Processing
- **Tempo Detection**: Auto-detect BPM for metronome sync
- **Key Detection**: Identify song key for music theory features
- **Noise Reduction**: Basic audio cleanup for poor recordings
- **Format Conversion**: Auto-convert unsupported formats

### Collaboration
- **Export Practice Data**: Share loop points and notes (not audio)
- **Backup/Restore**: Export practice routines with file references
- **Cloud Sync**: Optional cloud storage integration (future)

### Professional Features
- **Multi-track Support**: Upload stems/tracks separately
- **MIDI Sync**: Sync with external MIDI devices
- **Plugin Support**: VST/AU plugin integration for effects

## Performance Considerations

### Memory Management
- **Streaming Playback**: Don't load entire file into memory
- **Progressive Loading**: Load file chunks as needed
- **Cache Management**: Smart caching for frequently used files

### File Size Optimization
- **Compression**: Optional re-encoding for smaller files
- **Quality Settings**: User choice between quality vs storage
- **Background Processing**: Non-blocking file operations

## Implementation Phases

### Phase 1: Single Track Upload (2-3 weeks)
- File upload via drag-drop and browse
- Basic MP3/M4A support
- Simple file management interface
- Integration with existing player
- Database schema for single files

### Phase 2: Multi-Track Foundation (2-3 weeks)
- Multi-track upload checkbox and UI
- Stem group creation and database schema
- Multiple file selection and validation
- Basic synchronized playback
- Track naming and organization

### Phase 3: Mixing Interface (2-3 weeks)
- Individual track volume controls
- Mute and solo functionality
- Master volume control
- Real-time audio mixing
- Mix state persistence with routines

### Phase 4: Enhanced Player (1-2 weeks)
- Waveform visualization for stems
- Improved seek accuracy across all tracks
- Better format support (WAV, OGG)
- File metadata extraction
- Performance optimizations for multi-track

### Phase 5: Organization & Features (1-2 weeks)
- Advanced file management for both single and multi-track
- Search and filtering with track-aware capabilities
- Bulk operations for stem groups
- Storage management tools
- Tempo and key detection

## Success Metrics

### Usage Metrics
- **Adoption Rate**: % of users who upload files
- **File Count**: Average files per user
- **Practice Time**: Time spent with uploaded vs YouTube content
- **Retention**: User retention after first upload

### Technical Metrics
- **Performance**: File load times under 2 seconds
- **Reliability**: 99.9% upload success rate
- **Storage**: Average storage usage per user
- **Compatibility**: Format support coverage

## Risk Mitigation

### Technical Risks
- **Storage Bloat**: Implement cleanup and size limits
- **Format Support**: Extensive format testing
- **Performance**: Profile with large files
- **Cross-platform**: Test on all supported OS

### User Experience Risks
- **Complexity**: Keep interface simple and familiar
- **File Management**: Clear organization and search
- **Data Loss**: Backup and recovery features
- **Learning Curve**: Maintain consistency with YouTube workflow

## Competitive Analysis

### Existing Solutions
- **LoopBack**: Audio looping but no practice routines
- **Anytune**: Speed control but limited organization
- **Transcribe!**: Advanced features but complex UI
- **Amazing Slow Downer**: Basic but lacks modern UX

### Differentiation
- **Unified Interface**: Same UX for YouTube and local files
- **Practice Routines**: Advanced practice structure features
- **Modern UX**: Clean, musician-focused interface
- **Cross-platform**: Desktop app with native performance

This feature would significantly expand the app's utility while maintaining the core focus on structured practice routines and precise loop control.