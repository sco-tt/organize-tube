import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { useCustomFields } from '../../hooks/useCustomFields';
import { CustomFieldDefinition, CreateCustomFieldDefinition } from '../../repositories/customFieldRepository';
import './CustomFieldsModal.css';

interface CustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomFieldsModal({ isOpen, onClose }: CustomFieldsModalProps) {
  const {
    fields,
    loading,
    error,
    createField,
    updateField,
    deleteField,
    reorderFields
  } = useCustomFields();

  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newField, setNewField] = useState<CreateCustomFieldDefinition>({
    name: '',
    display_name: '',
    field_type: 'text',
    field_options: [],
    default_value: '',
    is_required: false,
    sort_order: fields.length
  });

  const handleCreate = async () => {
    try {
      if (!newField.name || !newField.display_name) {
        alert('Name and Display Name are required');
        return;
      }

      // Convert display name to internal name if not provided
      if (!newField.name) {
        newField.name = newField.display_name.toLowerCase().replace(/\s+/g, '_');
      }

      await createField(newField);
      setIsCreating(false);
      setNewField({
        name: '',
        display_name: '',
        field_type: 'text',
        field_options: [],
        default_value: '',
        is_required: false,
        sort_order: fields.length
      });
    } catch (error) {
      console.error('Failed to create field:', error);
    }
  };

  const handleEdit = async (field: CustomFieldDefinition) => {
    if (!editingField) return;

    try {
      await updateField(field.id, {
        display_name: editingField.display_name,
        field_type: editingField.field_type,
        field_options: editingField.field_options,
        default_value: editingField.default_value,
        is_required: editingField.is_required
      });
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  const handleDelete = async (field: CustomFieldDefinition) => {
    if (!confirm(`Delete "${field.display_name}" field? This will remove the field definition but keep existing data.`)) {
      return;
    }

    try {
      await deleteField(field.id);
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  const moveField = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

    try {
      await reorderFields(newFields.map(f => f.id));
    } catch (error) {
      console.error('Failed to reorder fields:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Custom Fields">
      <div className="custom-fields-modal">
        <div className="custom-fields-header">
          <h2>🎛️ Manage Custom Fields</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="create-field-btn"
          >
            ➕ Add Custom Field
          </button>
        </div>

        {loading && <div className="loading">Loading custom fields...</div>}
        {error && <div className="error">Error: {error}</div>}

        {isCreating && (
          <div className="field-editor">
            <h3>Create New Custom Field</h3>
            <div className="field-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    value={newField.display_name}
                    onChange={(e) => setNewField(prev => ({
                      ...prev,
                      display_name: e.target.value,
                      name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    }))}
                    placeholder="e.g., Nord Patch"
                  />
                </div>
                <div className="form-group">
                  <label>Internal Name *</label>
                  <input
                    type="text"
                    value={newField.name}
                    onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., nord_patch"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Field Type</label>
                  <select
                    value={newField.field_type}
                    onChange={(e) => setNewField(prev => ({
                      ...prev,
                      field_type: e.target.value as any,
                      field_options: e.target.value === 'select' ? ['Option 1', 'Option 2'] : []
                    }))}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Default Value</label>
                  <input
                    type="text"
                    value={newField.default_value}
                    onChange={(e) => setNewField(prev => ({ ...prev, default_value: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {newField.field_type === 'select' && (
                <div className="form-group">
                  <label>Dropdown Options (one per line)</label>
                  <textarea
                    value={newField.field_options?.join('\n') || ''}
                    onChange={(e) => setNewField(prev => ({
                      ...prev,
                      field_options: e.target.value.split('\n').filter(opt => opt.trim())
                    }))}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newField.is_required}
                    onChange={(e) => setNewField(prev => ({ ...prev, is_required: e.target.checked }))}
                  />
                  Required field
                </label>
              </div>

              <div className="form-actions">
                <button onClick={() => setIsCreating(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleCreate} className="save-btn">
                  Create Field
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fields-list">
          <h3>Current Custom Fields</h3>
          {fields.length === 0 ? (
            <p className="empty-state">No custom fields defined. Create your first custom field above!</p>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="field-item">
                <div className="field-info">
                  <div className="field-main">
                    <h4>{field.display_name}</h4>
                    <span className="field-type">{field.field_type}</span>
                    {field.is_required && <span className="required-badge">Required</span>}
                  </div>
                  <div className="field-details">
                    <span className="field-name">Internal: {field.name}</span>
                    {field.default_value && <span>Default: {field.default_value}</span>}
                    {field.field_options && field.field_options.length > 0 && (
                      <span>Options: {field.field_options.join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="field-actions">
                  <button
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="move-btn"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="move-btn"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => setEditingField(field)}
                    className="edit-btn"
                    title="Edit field"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(field)}
                    className="delete-btn"
                    title="Delete field"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {editingField && (
          <div className="field-editor">
            <h3>Edit Custom Field</h3>
            <div className="field-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    value={editingField.display_name}
                    onChange={(e) => setEditingField(prev => prev ? ({ ...prev, display_name: e.target.value }) : null)}
                  />
                </div>
                <div className="form-group">
                  <label>Field Type</label>
                  <select
                    value={editingField.field_type}
                    onChange={(e) => setEditingField(prev => prev ? ({
                      ...prev,
                      field_type: e.target.value as any,
                      field_options: e.target.value === 'select' ? (prev.field_options || ['Option 1']) : undefined
                    }) : null)}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Default Value</label>
                <input
                  type="text"
                  value={editingField.default_value || ''}
                  onChange={(e) => setEditingField(prev => prev ? ({ ...prev, default_value: e.target.value }) : null)}
                />
              </div>

              {editingField.field_type === 'select' && (
                <div className="form-group">
                  <label>Dropdown Options (one per line)</label>
                  <textarea
                    value={editingField.field_options?.join('\n') || ''}
                    onChange={(e) => setEditingField(prev => prev ? ({
                      ...prev,
                      field_options: e.target.value.split('\n').filter(opt => opt.trim())
                    }) : null)}
                    rows={4}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingField.is_required}
                    onChange={(e) => setEditingField(prev => prev ? ({ ...prev, is_required: e.target.checked }) : null)}
                  />
                  Required field
                </label>
              </div>

              <div className="form-actions">
                <button onClick={() => setEditingField(null)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={() => handleEdit(editingField)} className="save-btn">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}