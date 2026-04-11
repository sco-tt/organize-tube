// Test utilities for YouTube Player API integration

// Using embed-friendly videos for testing
export const TEST_YOUTUBE_URL = "https://www.youtube.com/watch?v=C0DPdy98e4c"; // Guitar lesson - usually embed-friendly
export const TEST_VIDEO_ID = "C0DPdy98e4c";

// Alternative test videos (uncomment to try)
// export const TEST_YOUTUBE_URL = "https://www.youtube.com/watch?v=09R8_2nJtjg"; // Suzuki violin method
// export const TEST_YOUTUBE_URL = "https://www.youtube.com/watch?v=kxopViU98Xo"; // Creative commons music

export function extractVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
}

export function validateYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== '';
}

export function testYouTubeAPIAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      resolve(true);
      return;
    }

    // Set up a timeout for the API load
    const timeout = setTimeout(() => {
      resolve(false);
    }, 10000); // 10 second timeout

    // Set up the callback for when API loads
    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      if (originalCallback) originalCallback();
      resolve(true);
    };

    // Load the API if not already loaded
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  });
}

// YouTube Player State Constants
export const YOUTUBE_PLAYER_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
} as const;