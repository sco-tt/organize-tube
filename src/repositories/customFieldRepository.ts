import { databaseService } from '../services/databaseService';

export interface CustomFieldDefinition {
  id: string;
  name: string; // Internal field name (snake_case)
  display_name: string; // User-friendly display name
  field_type: 'text' | 'number' | 'select' | 'textarea';
  field_options?: string[]; // For select dropdowns
  default_value?: string;
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFieldDefinition {
  name: string;
  display_name: string;
  field_type: 'text' | 'number' | 'select' | 'textarea';
  field_options?: string[];
  default_value?: string;
  is_required?: boolean;
  sort_order?: number;
}

export class CustomFieldRepository {
  async findAll(): Promise<CustomFieldDefinition[]> {
    const results = await databaseService.executeQuery<any>(
      `SELECT * FROM custom_field_definitions ORDER BY sort_order, display_name`
    );

    return results.map(row => ({
      ...row,
      field_options: row.field_options ? JSON.parse(row.field_options) : undefined,
      is_required: Boolean(row.is_required)
    }));
  }

  async findById(id: string): Promise<CustomFieldDefinition | null> {
    const results = await databaseService.executeQuery<any>(
      `SELECT * FROM custom_field_definitions WHERE id = ?`,
      [id]
    );

    if (results.length === 0) return null;

    const row = results[0];
    return {
      ...row,
      field_options: row.field_options ? JSON.parse(row.field_options) : undefined,
      is_required: Boolean(row.is_required)
    };
  }

  async findByName(name: string): Promise<CustomFieldDefinition | null> {
    const results = await databaseService.executeQuery<any>(
      `SELECT * FROM custom_field_definitions WHERE name = ?`,
      [name]
    );

    if (results.length === 0) return null;

    const row = results[0];
    return {
      ...row,
      field_options: row.field_options ? JSON.parse(row.field_options) : undefined,
      is_required: Boolean(row.is_required)
    };
  }

  async create(fieldDef: CreateCustomFieldDefinition): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await databaseService.executeNonQuery(
      `INSERT INTO custom_field_definitions
       (id, name, display_name, field_type, field_options, default_value, is_required, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        fieldDef.name,
        fieldDef.display_name,
        fieldDef.field_type,
        fieldDef.field_options ? JSON.stringify(fieldDef.field_options) : null,
        fieldDef.default_value || null,
        fieldDef.is_required || false,
        fieldDef.sort_order || 0,
        now,
        now,
      ]
    );

    return id;
  }

  async update(id: string, updates: Partial<CustomFieldDefinition>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        if (key === 'field_options' && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (updateFields.length === 0) return;

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await databaseService.executeNonQuery(
      `UPDATE custom_field_definitions SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async delete(id: string): Promise<void> {
    await databaseService.executeNonQuery(
      `DELETE FROM custom_field_definitions WHERE id = ?`,
      [id]
    );
  }

  async reorder(fieldIds: string[]): Promise<void> {
    await databaseService.transaction(async () => {
      for (let i = 0; i < fieldIds.length; i++) {
        await databaseService.executeNonQuery(
          `UPDATE custom_field_definitions SET sort_order = ?, updated_at = ? WHERE id = ?`,
          [i, new Date().toISOString(), fieldIds[i]]
        );
      }
    });
  }
}