import { useState, useEffect, useCallback } from 'react';
import { SongRoutineRepository, Tag } from '../repositories/songRoutineRepository';
import { databaseService } from '../services/databaseService';

const songRoutineRepo = new SongRoutineRepository();

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await databaseService.initialize();
      const data = await songRoutineRepo.getTags();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
      console.error('Error loading tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(async (name: string, color?: string) => {
    try {
      setError(null);
      await songRoutineRepo.createTag(name, color);
      await loadTags(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
      console.error('Error creating tag:', err);
      throw err;
    }
  }, [loadTags]);

  const addTagToSong = useCallback(async (songId: string, tagId: number) => {
    try {
      setError(null);
      await songRoutineRepo.addTagToRoutine(songId, tagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag to song');
      console.error('Error adding tag to song:', err);
      throw err;
    }
  }, []);

  const removeTagFromSong = useCallback(async (songId: string, tagId: number) => {
    try {
      setError(null);
      await songRoutineRepo.removeTagFromRoutine(songId, tagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove tag from song');
      console.error('Error removing tag from song:', err);
      throw err;
    }
  }, []);

  const getSongTags = useCallback(async (songId: string): Promise<Tag[]> => {
    try {
      return await songRoutineRepo.getRoutineTags(songId);
    } catch (err) {
      console.error('Error getting song tags:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tags,
    loading,
    error,
    createTag,
    addTagToSong,
    removeTagFromSong,
    getSongTags,
    refreshTags: loadTags,
  };
}