/**
 * Helper functions for handling structured user song data stored as JSON
 */

import { CustomFieldDefinition } from '../repositories/customFieldRepository';

export interface UserSongData {
  // All fields are dynamic based on user-defined custom field definitions
  [key: string]: any;
}

/**
 * Parse user song data from freeform_notes JSON string
 */
export function parseUserSongData(freeformNotes: string | null | undefined): UserSongData {
  if (!freeformNotes) return {};

  try {
    // Try to parse as JSON first
    return JSON.parse(freeformNotes);
  } catch {
    // If not JSON, try to parse structured text format
    return parseStructuredText(freeformNotes);
  }
}

/**
 * Convert user song data back to JSON string for storage
 */
export function stringifyUserSongData(data: UserSongData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse structured text like "Nord Patch: A11\nKey: Gm" into JSON
 */
function parseStructuredText(text: string): UserSongData {
  const data: UserSongData = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
      const value = line.substring(colonIndex + 1).trim();

      // Convert known numeric fields
      if (key === 'tempo' || key === 'capo_fret') {
        const num = parseInt(value);
        if (!isNaN(num)) {
          data[key] = num;
        }
      } else {
        data[key] = value;
      }
    }
  }

  return data;
}

/**
 * Convert user song data to readable display format using custom field definitions
 */
export function formatUserSongDataForDisplay(
  data: UserSongData,
  fieldDefinitions: CustomFieldDefinition[]
): string {
  const lines: string[] = [];

  // Sort field definitions by sort_order
  const sortedFields = [...fieldDefinitions].sort((a, b) => a.sort_order - b.sort_order);

  // Add fields in order defined by user
  sortedFields.forEach(fieldDef => {
    const value = data[fieldDef.name];
    if (value !== undefined && value !== '') {
      lines.push(`${fieldDef.display_name}: ${value}`);
    }
  });

  // Add any fields not in definitions (for backwards compatibility)
  Object.entries(data).forEach(([key, value]) => {
    const isDefinedField = fieldDefinitions.some(def => def.name === key);
    if (!isDefinedField && value !== undefined && value !== '') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      lines.push(`${label}: ${value}`);
    }
  });

  return lines.join('\n');
}

/**
 * Validate user song data against custom field definitions
 */
export function validateUserSongData(
  data: UserSongData,
  fieldDefinitions: CustomFieldDefinition[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  fieldDefinitions.forEach(fieldDef => {
    const value = data[fieldDef.name];

    // Check required fields
    if (fieldDef.is_required && (value === undefined || value === '')) {
      errors.push(`${fieldDef.display_name} is required`);
    }

    // Validate field types
    if (value !== undefined && value !== '') {
      if (fieldDef.field_type === 'number' && isNaN(Number(value))) {
        errors.push(`${fieldDef.display_name} must be a number`);
      }

      if (fieldDef.field_type === 'select' && fieldDef.field_options) {
        if (!fieldDef.field_options.includes(String(value))) {
          errors.push(`${fieldDef.display_name} must be one of: ${fieldDef.field_options.join(', ')}`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}