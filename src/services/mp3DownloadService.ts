// Mock invoke function for web development
const invoke = async (command: string, args?: any): Promise<any> => {
  // Try to use Tauri API directly
  try {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    console.log('Tauri API imported successfully, attempting invoke:', command);
    return tauriInvoke(command, args);
  } catch (error) {
    console.error('Tauri API import/invoke failed:', error);
    console.log('Fallback to mock implementation for:', command);
  }

  // Fallback to mock implementation
  console.log('Mock Tauri invoke:', command, args);

  switch (command) {
    case 'is_mp3_download_enabled':
      return false; // Disabled in web mode
    case 'download_youtube_mp3':
      throw new Error('MP3 download is only available in the desktop app');
    default:
      throw new Error(`Mock: Unknown Tauri command: ${command}`);
  }
};

export class Mp3DownloadService {
  private static instance: Mp3DownloadService;
  private isFeatureEnabled: boolean | null = null;

  static getInstance(): Mp3DownloadService {
    if (!this.instance) {
      this.instance = new Mp3DownloadService();
    }
    return this.instance;
  }

  /**
   * Check if MP3 download feature is enabled via environment variable
   */
  async isDownloadEnabled(): Promise<boolean> {
    if (this.isFeatureEnabled === null) {
      try {
        this.isFeatureEnabled = await invoke<boolean>('is_mp3_download_enabled');
      } catch (error) {
        console.error('Failed to check MP3 download feature flag:', error);
        this.isFeatureEnabled = false;
      }
    }
    return this.isFeatureEnabled;
  }

  /**
   * Download YouTube video as MP3
   * @param videoUrl - YouTube video URL
   * @param filename - Desired filename (without extension)
   * @param downloadPath - Directory path for download (optional)
   */
  async downloadMp3(
    videoUrl: string,
    filename: string,
    downloadPath?: string
  ): Promise<{ success: boolean; message: string; filePath?: string }> {
    try {
      const isEnabled = await this.isDownloadEnabled();
      if (!isEnabled) {
        return {
          success: false,
          message: 'MP3 download feature is disabled. Set DOWNLOAD_MP3=true environment variable to enable.'
        };
      }

      // Generate safe filename
      const safeFilename = this.sanitizeFilename(filename);

      // Construct output path pattern for yt-dlp
      const outputPattern = downloadPath
        ? `${downloadPath}/${safeFilename}.%(ext)s`
        : `~/Downloads/${safeFilename}.%(ext)s`;

      const result = await invoke<string>('download_youtube_mp3', {
        videoUrl,
        outputPath: outputPattern
      });

      return {
        success: true,
        message: result,
        filePath: outputPattern.replace('.%(ext)s', '.mp3')
      };

    } catch (error) {
      console.error('MP3 download failed:', error);
      return {
        success: false,
        message: error as string || 'Download failed with unknown error'
      };
    }
  }

  /**
   * Sanitize filename for filesystem compatibility
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, '_')         // Replace spaces with underscores
      .substring(0, 100)            // Limit length
      .trim();
  }

  /**
   * Check if the built-in downloader is available
   */
  async checkDownloaderAvailability(): Promise<{ available: boolean; message: string }> {
    try {
      const isEnabled = await this.isDownloadEnabled();
      if (!isEnabled) {
        return {
          available: false,
          message: 'MP3 download feature is disabled'
        };
      }

      return {
        available: true,
        message: 'Built-in YouTube downloader is ready'
      };

    } catch (error) {
      return {
        available: false,
        message: 'Download feature unavailable: ' + (error as string)
      };
    }
  }
}