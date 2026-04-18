import { SongRoutineRepository, CreateSongRoutine } from '../repositories/songRoutineRepository';
import { LoopSegmentRepository, CreateLoopSegment } from '../repositories/loopSegmentRepository';
import { databaseService } from './databaseService';
import { UserSongData, parseUserSongData, stringifyUserSongData } from '../utils/userSongData';
import { extractVideoId, fetchVideoTitle, isYouTubeUrl } from '../utils/youtubeUtils';

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
        if (!songData.url) {
          results.errors.push(`Row ${i + 2}: Missing required field: URL`);
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
    // Create mapping of normalized headers to their original index
    const headerMap = new Map<string, number>();
    headers.forEach((header, index) => {
      headerMap.set(this.normalizeHeader(header), index);
    });

    const getValueByField = (fieldVariations: string[]): string => {
      for (const variation of fieldVariations) {
        const normalized = this.normalizeHeader(variation);
        if (headerMap.has(normalized)) {
          const index = headerMap.get(normalized)!;
          return row[index] || '';
        }
      }
      return '';
    };

    return {
      title: getValueByField(['Title', 'Song Title', 'Track Title', 'Song Name', 'Name']),
      artist: getValueByField(['Artist', 'Performer', 'Band', 'Musician', 'Singer']),
      url: getValueByField(['URL', 'Link', 'YouTube URL', 'Video URL', 'YouTube Link']),
      url_source: 'youtube',
      duration: parseInt(getValueByField(['Duration', 'Length', 'Time', 'Duration (seconds)', 'Length (sec)'])) || 0,
      volume: parseInt(getValueByField(['Volume', 'Vol', 'Volume %', 'Volume Level'])) || 100,
      notes: getValueByField(['Notes', 'Note', 'Comments', 'Description', 'Practice Notes']),
      freeform_notes: getValueByField(['Freeform Notes', 'Free Notes', 'Additional Notes', 'Memo', 'Details'])
    };
  }

  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters and spaces
      .trim();
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

  /**
   * Analyzes CSV content and suggests header mappings using custom field definitions
   */
  async analyzeCsvHeaders(
    csvContent: string,
    customFields: Array<{ name: string; display_name: string }>
  ): Promise<{
    detectedHeaders: string[];
    suggestedMappings: Record<string, string>;
    unmappedColumns: string[];
    confidence: Record<string, number>;
  }> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV content is empty');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    const firstDataRow = lines.length > 1 ? this.parseCSVRow(lines[1]) : [];

    const suggestedMappings: Record<string, string> = {};
    const confidence: Record<string, number> = {};
    const unmappedColumns: string[] = [];

    // Base field patterns for core song fields only
    // Note: name and title are excluded since they'll be auto-generated from YouTube
    const fieldPatterns: Record<string, RegExp> = {
      artist: /^(artist|performer|band|musician|singer)/i,
      url: /^(url|link|youtube|video|href)/i,
      duration: /^(duration|length|time|seconds|sec|mins)/i,
      volume: /^(volume|vol|level|gain)/i,
      notes: /^(notes?|comment|description|memo|detail)/i,
    };

    // Add patterns for user's custom fields
    customFields.forEach(field => {
      // Create pattern based on field name and display name
      const namePattern = field.name.replace(/_/g, '|');
      const displayPattern = field.display_name.replace(/\s+/g, '|');
      fieldPatterns[field.name] = new RegExp(`^(${namePattern}|${displayPattern})`, 'i');
    });

    headers.forEach((header, index) => {
      let bestMatch = '';
      let bestScore = 0;

      // Try pattern matching first
      for (const [field, pattern] of Object.entries(fieldPatterns)) {
        if (pattern.test(header)) {
          const score = this.calculateMatchScore(header, field, firstDataRow[index]);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = field;
          }
        }
      }

      // If no pattern match, try data analysis
      if (!bestMatch && firstDataRow[index]) {
        const dataMatch = this.analyzeDataPattern(firstDataRow[index]);
        if (dataMatch) {
          bestMatch = dataMatch;
          bestScore = 0.6; // Lower confidence for data-based detection
        }
      }

      if (bestMatch && bestScore > 0.4) {
        suggestedMappings[header] = bestMatch;
        confidence[header] = bestScore;
      } else {
        unmappedColumns.push(header);
      }
    });

    return {
      detectedHeaders: headers,
      suggestedMappings,
      unmappedColumns,
      confidence
    };
  }

  /**
   * Generates a CSV template with proper headers for song import
   */
  generateCsvTemplate(): string {
    const headers = [
      'Name',
      'Title',
      'Artist',
      'URL',
      'Duration',
      'Volume',
      'Notes',
      'Freeform Notes'
    ];

    const exampleRow = [
      'My Practice Song',
      'Amazing Grace',
      'Traditional',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      '240',
      '100',
      'Practice at 0.8x speed',
      'Focus on the bridge section'
    ];

    return [headers, exampleRow].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  private calculateMatchScore(header: string, field: string, dataValue?: string): number {
    let score = 0.5; // Base score for pattern match

    // Exact field name match gets highest score
    if (this.normalizeHeader(header) === this.normalizeHeader(field)) {
      score = 1.0;
    }

    // Bonus for data content validation
    if (dataValue) {
      switch (field) {
        case 'url':
          if (dataValue.includes('youtube.com') || dataValue.includes('youtu.be')) {
            score += 0.3;
          } else if (dataValue.match(/^https?:\/\//)) {
            score += 0.2;
          }
          break;
        case 'duration':
          if (!isNaN(Number(dataValue))) {
            score += 0.2;
          }
          break;
        case 'volume':
          const vol = Number(dataValue);
          if (!isNaN(vol) && vol >= 0 && vol <= 100) {
            score += 0.3;
          }
          break;
      }
    }

    return Math.min(score, 1.0);
  }

  private analyzeDataPattern(dataValue: string): string | null {
    // URL detection
    if (dataValue.includes('youtube.com') || dataValue.includes('youtu.be')) {
      return 'url';
    }
    if (dataValue.match(/^https?:\/\//)) {
      return 'url';
    }

    // Duration detection (numbers that could be seconds)
    const num = Number(dataValue);
    if (!isNaN(num) && num > 10 && num < 7200) { // 10 seconds to 2 hours
      return 'duration';
    }

    // Volume detection (0-100 range)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      return 'volume';
    }

    return null;
  }

  /**
   * Import songs from CSV using custom field mappings
   */
  async importSongsFromCSVWithMappings(
    csvContent: string,
    customMappings: Record<string, string>,
    options: { fetchYouTubeTitles?: boolean } = {}
  ): Promise<ImportResult> {
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
        let songData = this.mapRowWithCustomMappings(headers, row, customMappings);

        // Validate required fields
        if (!songData.url) {
          results.errors.push(`Row ${i + 2}: Missing required field: URL`);
          continue;
        }

        // Fetch YouTube title if enabled and URL is YouTube
        if (options.fetchYouTubeTitles && isYouTubeUrl(songData.url)) {
          try {
            const videoId = extractVideoId(songData.url);
            if (videoId) {
              console.log(`Fetching YouTube title for row ${i + 2}: ${songData.url}`);
              const { title, author } = await fetchVideoTitle(videoId);

              // Only override if current title is generic or empty
              if (!songData.title || songData.title.trim() === '') {
                songData.title = title;
              }
              if (!songData.artist || songData.artist.trim() === '') {
                songData.artist = author;
              }

              console.log(`Fetched title: "${title}" by ${author}`);
            }
          } catch (error) {
            console.warn(`Failed to fetch YouTube title for row ${i + 2}:`, error);
            // Continue with import even if YouTube fetch fails
          }
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

  private mapRowWithCustomMappings(
    headers: string[],
    row: string[],
    mappings: Record<string, string>
  ): CreateSongRoutine {
    const getValue = (csvHeader: string): string => {
      const index = headers.indexOf(csvHeader);
      return index >= 0 ? row[index] || '' : '';
    };

    // Build song data using only the accepted mappings
    const songData: CreateSongRoutine = {
      url: '',
      url_source: 'youtube',
      duration: 0,
      volume: 100,
      title: '',
      artist: '',
      notes: '',
      freeform_notes: ''
    };

    // Start with existing user song data
    const existingUserData = parseUserSongData(songData.freeform_notes);
    const userData: UserSongData = { ...existingUserData };

    // Apply custom mappings
    Object.entries(mappings).forEach(([csvHeader, songField]) => {
      const value = getValue(csvHeader);
      if (value) {
        if (songField.startsWith('custom:')) {
          // Handle custom fields in user_song_data
          const customFieldName = songField.replace('custom:', '').toLowerCase().replace(/\s+/g, '_');
          if (customFieldName.trim()) {
            userData[customFieldName] = value;
          }
        } else {
          // Handle standard fields
          switch (songField) {
            case 'title':
              songData.title = value;
              break;
            case 'artist':
              songData.artist = value;
              break;
            case 'url':
              songData.url = value;
              break;
            case 'duration':
              songData.duration = parseInt(value) || 0;
              break;
            case 'volume':
              songData.volume = parseInt(value) || 100;
              break;
            case 'notes':
              songData.notes = value;
              break;
            // Structured user song data fields
            case 'nord_patch':
              userData.nord_patch = value;
              break;
            case 'song_key':
              userData.song_key = value;
              break;
            case 'tempo':
              userData.tempo = parseInt(value) || undefined;
              break;
            case 'time_signature':
              userData.time_signature = value;
              break;
            case 'capo_fret':
              userData.capo_fret = parseInt(value) || undefined;
              break;
            case 'tuning':
              userData.tuning = value;
              break;
            case 'practice_notes':
              userData.practice_notes = value;
              break;
            case 'my_notes':
              userData.my_notes = value;
              break;
            case 'freeform_notes':
              // Keep as raw text if explicitly mapped
              songData.freeform_notes = value;
              return; // Skip JSON conversion for this case
          }
        }
      }
    });

    // Store user song data as JSON in freeform_notes
    if (Object.keys(userData).length > 0) {
      songData.freeform_notes = stringifyUserSongData(userData);
    }

    return songData;
  }
}