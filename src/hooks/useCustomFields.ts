import { useState, useEffect, useCallback } from 'react';
import { CustomFieldRepository, CustomFieldDefinition, CreateCustomFieldDefinition } from '../repositories/customFieldRepository';
import { databaseService } from '../services/databaseService';

const customFieldRepo = new CustomFieldRepository();

export function useCustomFields() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await databaseService.initialize();
      const data = await customFieldRepo.findAll();
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load custom fields');
      console.error('Error loading custom fields:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createField = useCallback(async (fieldData: CreateCustomFieldDefinition) => {
    try {
      setError(null);
      await customFieldRepo.create(fieldData);
      await loadFields(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create custom field');
      console.error('Error creating custom field:', err);
      throw err;
    }
  }, [loadFields]);

  const updateField = useCallback(async (id: string, updates: Partial<CustomFieldDefinition>) => {
    try {
      setError(null);
      await customFieldRepo.update(id, updates);
      await loadFields(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update custom field');
      console.error('Error updating custom field:', err);
      throw err;
    }
  }, [loadFields]);

  const deleteField = useCallback(async (id: string) => {
    try {
      setError(null);
      await customFieldRepo.delete(id);
      await loadFields(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete custom field');
      console.error('Error deleting custom field:', err);
      throw err;
    }
  }, [loadFields]);

  const reorderFields = useCallback(async (fieldIds: string[]) => {
    try {
      setError(null);
      await customFieldRepo.reorder(fieldIds);
      await loadFields(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder custom fields');
      console.error('Error reordering custom fields:', err);
      throw err;
    }
  }, [loadFields]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  return {
    fields,
    loading,
    error,
    createField,
    updateField,
    deleteField,
    reorderFields,
    refreshFields: loadFields,
  };
}