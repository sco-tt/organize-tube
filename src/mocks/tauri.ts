// Mock Tauri API for web development
export const invoke = async (command: string, args?: any): Promise<any> => {
  console.log('Mock Tauri invoke:', command, args);

  switch (command) {
    case 'is_mp3_download_enabled':
      return process.env.DOWNLOAD_MP3 === 'true';

    case 'download_youtube_mp3':
      throw new Error('MP3 download is only available in the desktop app');

    default:
      throw new Error(`Mock: Unknown Tauri command: ${command}`);
  }
};