import { useState, useEffect, useCallback } from 'react';
import { SongRoutineRepository, SongRoutine, CreateSongRoutine } from '../repositories/songRoutineRepository';
import { databaseService } from '../services/databaseService';

const songRoutineRepo = new SongRoutineRepository();

export function useSavedSongs() {
  const [songs, setSongs] = useState<SongRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSongs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await databaseService.initialize();
      const data = await songRoutineRepo.findAll();
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSong = useCallback(async (songData: CreateSongRoutine) => {
    try {
      console.log('useSavedSongs: Starting song save with data:', songData);
      setError(null);

      console.log('useSavedSongs: Calling songRoutineRepo.create...');
      const id = await songRoutineRepo.create(songData);
      console.log('useSavedSongs: Song created successfully with ID:', id);

      console.log('useSavedSongs: Refreshing songs list...');
      await loadSongs(); // Refresh the list
      console.log('useSavedSongs: Save completed successfully');

      return id;
    } catch (err) {
      console.error('useSavedSongs: Error saving song - full error:', err);
      console.error('useSavedSongs: Error type:', typeof err);
      console.error('useSavedSongs: Error toString:', err?.toString());

      const errorMsg = err instanceof Error ? err.message : 'Failed to save song';
      setError(errorMsg);
      console.error('useSavedSongs: Setting error message:', errorMsg);

      throw err;
    }
  }, [loadSongs]);

  const updateSong = useCallback(async (id: string, updates: Partial<SongRoutine>) => {
    try {
      setError(null);
      await songRoutineRepo.update(id, updates);
      await loadSongs(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update song');
      console.error('Error updating song:', err);
      throw err;
    }
  }, [loadSongs]);

  const deleteSong = useCallback(async (id: string) => {
    try {
      setError(null);
      await songRoutineRepo.delete(id);
      await loadSongs(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete song');
      console.error('Error deleting song:', err);
      throw err;
    }
  }, [loadSongs]);

  const searchSongs = useCallback(async (query: string) => {
    try {
      setError(null);
      if (!query.trim()) {
        return songs;
      }
      const results = await songRoutineRepo.searchRoutines(query);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search songs');
      console.error('Error searching songs:', err);
      return [];
    }
  }, [songs]);

  const markPracticed = useCallback(async (id: string) => {
    try {
      setError(null);
      await songRoutineRepo.updateLastPracticed(id);
      await loadSongs(); // Refresh to show updated timestamp
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as practiced');
      console.error('Error marking practiced:', err);
      throw err;
    }
  }, [loadSongs]);

  const checkUrlExists = useCallback(async (url: string): Promise<boolean> => {
    try {
      const existing = await songRoutineRepo.findByUrl(url);
      return !!existing;
    } catch (err) {
      console.error('Error checking URL:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  return {
    songs,
    loading,
    error,
    saveSong,
    updateSong,
    deleteSong,
    searchSongs,
    markPracticed,
    checkUrlExists,
    refreshSongs: loadSongs,
  };
}