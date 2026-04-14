import { SongRoutineRepository } from '../repositories/songRoutineRepository';
import { LoopSegmentRepository } from '../repositories/loopSegmentRepository';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { downloadDir } from '@tauri-apps/api/path';

export class CSVExportService {
  private songRoutineRepo = new SongRoutineRepository();
  private loopSegmentRepo = new LoopSegmentRepository();

  async exportAllData(): Promise<string> {
    const routines = await this.songRoutineRepo.findAll();

    // Create CSV with all song routine data
    const headers = [
      'ID', 'Name', 'Title', 'Artist', 'URL', 'Duration', 'Volume',
      'Notes', 'Freeform Notes', 'Created At', 'Last Practiced'
    ];

    const rows = routines.map(routine => [
      routine.id,
      routine.name,
      routine.title,
      routine.artist,
      routine.url,
      routine.duration.toString(),
      routine.volume.toString(),
      routine.notes,
      routine.freeform_notes,
      routine.created_at,
      routine.last_practiced || ''
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  async exportLoopSegments(): Promise<string> {
    const segments = await this.loopSegmentRepo.findAll();

    const headers = [
      'ID', 'Song Routine ID', 'Segment Name', 'Start Time', 'End Time', 'Default Speed', 'Order Index'
    ];

    const rows = segments.map(segment => [
      segment.id,
      segment.song_routine_id || 'Standalone',
      segment.name,
      segment.start_time.toString(),
      segment.end_time.toString(),
      segment.default_speed.toString(),
      segment.order_index.toString()
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  private arrayToCSV(data: string[][]): string {
    return data.map(row =>
      row.map(field => {
        // Escape quotes and wrap in quotes if needed
        if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')
    ).join('\n');
  }

  async exportToFile(): Promise<void> {
    try {
      const songData = await this.exportAllData();
      const segmentData = await this.exportLoopSegments();

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

      const downloadsPath = await downloadDir();

      await writeTextFile(
        `${downloadsPath}/segment-studio-songs-${timestamp}.csv`,
        songData
      );

      await writeTextFile(
        `${downloadsPath}/segment-studio-segments-${timestamp}.csv`,
        segmentData
      );

      console.log('Data exported successfully to Downloads folder');
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  async exportBackup(): Promise<void> {
    try {
      // Export everything as one comprehensive backup
      const routines = await this.songRoutineRepo.findAll();
      const segments = await this.loopSegmentRepo.findAll();
      const tags = await this.songRoutineRepo.getTags();

      const backupData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        routines,
        segments,
        tags
      };

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const downloadsPath = await downloadDir();

      await writeTextFile(
        `${downloadsPath}/segment-studio-backup-${timestamp}.json`,
        JSON.stringify(backupData, null, 2)
      );

      console.log('Backup created successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }
}