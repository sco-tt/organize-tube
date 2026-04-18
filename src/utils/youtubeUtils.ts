/**
 * YouTube utility functions
 */

export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^#\&\?]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Just the video ID itself
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export async function fetchVideoTitle(videoId: string): Promise<{title: string, author: string}> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || `Video ${videoId}`,
        author: data.author_name || 'Unknown Artist'
      };
    }
  } catch (error) {
    console.error('Failed to fetch video title:', error);
  }

  return {
    title: `Video ${videoId}`,
    author: 'Unknown Artist'
  };
}

export function isYouTubeUrl(url: string): boolean {
  return !!extractVideoId(url);
}