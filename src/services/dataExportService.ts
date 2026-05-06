import { databaseService } from './databaseService';

export interface ExportData {
  songRoutines: any[];
  loopSegments: any[];
  tags: any[];
  songRoutineTags: any[];
  practiceSteps: any[];
  setLists: any[];
  setListItems: any[];
  resourceLinks: any[];
  customFieldDefinitions: any[];
  appSettings: any[];
  exportMetadata: {
    exportDate: string;
    version: string;
    tableCount: number;
    totalRecords: number;
  };
}

export class DataExportService {
  private static instance: DataExportService;

  private constructor() {
    // Use the exported databaseService instance
  }

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  async exportAllData(): Promise<ExportData> {
    const [
      songRoutines,
      loopSegments,
      tags,
      songRoutineTags,
      practiceSteps,
      setLists,
      setListItems,
      resourceLinks,
      customFieldDefinitions,
      appSettings
    ] = await Promise.all([
      databaseService.executeQuery('SELECT * FROM song_routines ORDER BY created_at'),
      databaseService.executeQuery('SELECT * FROM loop_segments ORDER BY created_at'),
      databaseService.executeQuery('SELECT * FROM tags ORDER BY id'),
      databaseService.executeQuery('SELECT * FROM song_routine_tags'),
      databaseService.executeQuery('SELECT * FROM practice_steps ORDER BY song_routine_id, order_index'),
      databaseService.executeQuery('SELECT * FROM set_lists ORDER BY created_at'),
      databaseService.executeQuery('SELECT * FROM set_list_items ORDER BY set_list_id, order_index'),
      databaseService.executeQuery('SELECT * FROM resource_links ORDER BY song_routine_id'),
      databaseService.executeQuery('SELECT * FROM custom_field_definitions ORDER BY sort_order'),
      databaseService.executeQuery('SELECT * FROM app_settings ORDER BY key')
    ]);

    const totalRecords = songRoutines.length + loopSegments.length + tags.length +
                        songRoutineTags.length + practiceSteps.length + setLists.length +
                        setListItems.length + resourceLinks.length + customFieldDefinitions.length +
                        appSettings.length;

    return {
      songRoutines,
      loopSegments,
      tags,
      songRoutineTags,
      practiceSteps,
      setLists,
      setListItems,
      resourceLinks,
      customFieldDefinitions,
      appSettings,
      exportMetadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        tableCount: 10,
        totalRecords
      }
    };
  }

  async exportToJSON(): Promise<string> {
    const data = await this.exportAllData();
    return JSON.stringify(data, null, 2);
  }

  async exportToCSV(): Promise<{ [tableName: string]: string }> {
    const data = await this.exportAllData();
    const csvFiles: { [tableName: string]: string } = {};

    // Convert each table to CSV
    const tables = [
      { name: 'song_routines', data: data.songRoutines },
      { name: 'loop_segments', data: data.loopSegments },
      { name: 'tags', data: data.tags },
      { name: 'song_routine_tags', data: data.songRoutineTags },
      { name: 'practice_steps', data: data.practiceSteps },
      { name: 'set_lists', data: data.setLists },
      { name: 'set_list_items', data: data.setListItems },
      { name: 'resource_links', data: data.resourceLinks },
      { name: 'custom_field_definitions', data: data.customFieldDefinitions },
      { name: 'app_settings', data: data.appSettings }
    ];

    for (const table of tables) {
      csvFiles[table.name] = this.arrayToCSV(table.data);
    }

    return csvFiles;
  }

  private arrayToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  async exportAndSave(format: 'json' | 'csv'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'json') {
      const jsonData = await this.exportToJSON();
      const filename = `segment-studio-backup-${timestamp}.json`;
      await this.saveToFile(filename, jsonData);
      return filename;
    } else {
      const csvFiles = await this.exportToCSV();
      const filenames: string[] = [];

      for (const [tableName, csvContent] of Object.entries(csvFiles)) {
        if (csvContent.trim()) { // Only save non-empty tables
          const filename = `segment-studio-${tableName}-${timestamp}.csv`;
          await this.saveToFile(filename, csvContent);
          filenames.push(filename);
        }
      }

      return `Exported ${filenames.length} files: ${filenames.join(', ')}`;
    }
  }

  private async saveToFile(filename: string, content: string): Promise<void> {
    // For now, use browser download (can be enhanced with Tauri file dialog later)
    const blob = new Blob([content], {
      type: filename.endsWith('.json') ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Add to DOM for Firefox compatibility
    a.click();
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url);
  }

  // Quick export for development - save to downloads with auto-generated name
  async quickExport(format: 'json' | 'csv' = 'json'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'json') {
      const jsonData = await this.exportToJSON();
      const filename = `segment-studio-backup-${timestamp}.json`;

      // Auto-download without dialog
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      return filename;
    } else {
      // For CSV, create a zip file with all tables
      return await this.exportAndSave('csv');
    }
  }
}