import { SongRoutineRepository, CreateSongRoutine } from '../repositories/songRoutineRepository';
import { LoopSegmentRepository, CreateLoopSegment } from '../repositories/loopSegmentRepository';
import { databaseService } from './databaseService';

export interface ImportResult {
  success: number;
  errors: string[];
  skipped: number;
}

export class CSVImportService {
  private songRoutineRepo = new SongRoutineRepository();
  private loopSegmentRepo = new LoopSegmentRepository();

  async importSongsFromCSV(csvContent: string): Promise<ImportResult> {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    const dataRows = lines.slice(1).filter(line => line.trim());

    const results: ImportResult = {
      success: 0,
      errors: [],
      skipped: 0
    };

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = this.parseCSVRow(dataRows[i]);
        const songData = this.mapRowToSong(headers, row);

        // Validate required fields
        if (!songData.url || !songData.name) {
          results.errors.push(`Row ${i + 2}: Missing required fields (URL or Name)`);
          continue;
        }

        // Check for duplicates
        const existing = await this.songRoutineRepo.findByUrl(songData.url);
        if (existing) {
          results.skipped++;
          continue;
        }

        await this.songRoutineRepo.create(songData);
        results.success++;
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  async importSegmentsFromCSV(csvContent: string): Promise<ImportResult> {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    const dataRows = lines.slice(1).filter(line => line.trim());

    const results: ImportResult = {
      success: 0,
      errors: [],
      skipped: 0
    };

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = this.parseCSVRow(dataRows[i]);
        const segmentData = this.mapRowToSegment(headers, row);

        // Validate required fields
        if (!segmentData.name || segmentData.start_time < 0 || segmentData.end_time <= segmentData.start_time) {
          results.errors.push(`Row ${i + 2}: Invalid segment data`);
          continue;
        }

        // Check if song_routine_id exists (if specified and not 'Standalone')
        if (segmentData.song_routine_id && segmentData.song_routine_id !== 'Standalone') {
          const routine = await this.songRoutineRepo.findById(segmentData.song_routine_id);
          if (!routine) {
            results.errors.push(`Row ${i + 2}: Song routine ${segmentData.song_routine_id} not found`);
            continue;
          }
        }

        await this.loopSegmentRepo.create(segmentData);
        results.success++;
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  async importBackupFromJSON(jsonContent: string): Promise<ImportResult> {
    try {
      const backupData = JSON.parse(jsonContent);
      const results: ImportResult = { success: 0, errors: [], skipped: 0 };

      // Validate backup format
      if (!backupData.routines || !backupData.segments) {
        throw new Error('Invalid backup format');
      }

      await databaseService.transaction(async () => {
        // Import routines
        for (const routine of backupData.routines) {
          try {
            const existing = await this.songRoutineRepo.findByUrl(routine.url);
            if (existing) {
              results.skipped++;
              continue;
            }

            const songData: CreateSongRoutine = {
              name: routine.name,
              title: routine.title,
              artist: routine.artist,
              url: routine.url,
              url_source: routine.url_source,
              duration: routine.duration,
              notes: routine.notes,
              freeform_notes: routine.freeform_notes,
              volume: routine.volume
            };

            await this.songRoutineRepo.create(songData);
            results.success++;
          } catch (error) {
            results.errors.push(`Routine ${routine.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Import segments
        for (const segment of backupData.segments) {
          try {
            const segmentData: CreateLoopSegment = {
              song_routine_id: segment.song_routine_id,
              name: segment.name,
              start_time: segment.start_time,
              end_time: segment.end_time,
              default_speed: segment.default_speed,
              order_index: segment.order_index
            };

            await this.loopSegmentRepo.create(segmentData);
          } catch (error) {
            results.errors.push(`Segment ${segment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      });

      return results;
    } catch (error) {
      throw new Error(`Failed to import backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private mapRowToSong(headers: string[], row: string[]): CreateSongRoutine {
    const getValue = (header: string): string => {
      const index = headers.indexOf(header);
      return index >= 0 ? row[index] || '' : '';
    };

    return {
      name: getValue('Name'),
      title: getValue('Title'),
      artist: getValue('Artist'),
      url: getValue('URL'),
      url_source: 'youtube',
      duration: parseInt(getValue('Duration')) || 0,
      volume: parseInt(getValue('Volume')) || 100,
      notes: getValue('Notes'),
      freeform_notes: getValue('Freeform Notes')
    };
  }

  private mapRowToSegment(headers: string[], row: string[]): CreateLoopSegment {
    const getValue = (header: string): string => {
      const index = headers.indexOf(header);
      return index >= 0 ? row[index] || '' : '';
    };

    const songRoutineId = getValue('Song Routine ID');

    return {
      song_routine_id: songRoutineId === 'Standalone' ? undefined : songRoutineId,
      name: getValue('Segment Name'),
      start_time: parseFloat(getValue('Start Time')) || 0,
      end_time: parseFloat(getValue('End Time')) || 0,
      default_speed: parseFloat(getValue('Default Speed')) || 1.0,
      order_index: parseInt(getValue('Order Index')) || 0
    };
  }
}