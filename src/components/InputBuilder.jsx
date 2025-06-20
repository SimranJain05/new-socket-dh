import React, { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';

const fieldTypes = [
  { value: 'input', label: 'Text Input' },
  { value: 'email', label: 'Email Input' },
  { value: 'tel', label: 'Phone Input' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'dynamic_dropdown', label: 'Dynamic Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Button' },
  { value: 'input_group', label: 'Input Group' },
  { value: 'dynamic_fields', label: 'Dynamic Fields' }
];

const defaultFieldValues = {
  id: '',
  type: 'input',
  title: '',
  placeholder: '',
  help: '',
  required: false,
  defaultValue: '',
  options: [],
  dynamicOptions: '',
  children: []
};

export default function InputBuilder({ onAddField, parentPath = [] }) {
  const [open, setOpen] = useState(false);
  const [fieldData, setFieldData] = useState(defaultFieldValues);
  const [errors, setErrors] = useState({});

  const handleOpen = () => {
    setOpen(true);
    setFieldData(defaultFieldValues);
    setErrors({});
  };

  const handleClose = () => {
    setOpen(false);
  };

  const validate = useCallback(() => {
    const newErrors = {};
    if (!fieldData.id.trim()) newErrors.id = 'ID is required';
    if (!fieldData.type) newErrors.type = 'Type is required';
    if (!fieldData.title.trim()) newErrors.title = 'Title is required';
    if (fieldData.type === 'dropdown' && fieldData.options.length === 0) {
      newErrors.options = 'At least one option is required';
    }
    if (fieldData.type === 'dynamic_dropdown' && !fieldData.dynamicOptions.trim()) {
      newErrors.dynamicOptions = 'Dynamic options function is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fieldData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFieldData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleAddOption = useCallback(() => {
    setFieldData(prev => ({
      ...prev,
      options: [...prev.options, { label: '', value: '' }]
    }));
  }, []);

  const handleOptionChange = useCallback((index, key, value) => {
    setFieldData(prev => {
      const newOptions = [...prev.options];
      newOptions[index][key] = value;
      return { ...prev, options: newOptions };
    });
  }, []);

  const handleRemoveOption = useCallback((index) => {
    setFieldData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const newField = {
      id: fieldData.id,
      type: fieldData.type,
      title: fieldData.title,
      placeholder: fieldData.placeholder,
      help: fieldData.help,
      required: fieldData.required,
      defaultValue: fieldData.defaultValue,
      children: fieldData.children
    };

    if (fieldData.type === 'dropdown') {
      newField.options = fieldData.options;
    } else if (fieldData.type === 'dynamic_dropdown') {
      newField.dynamicOptions = fieldData.dynamicOptions;
    } else if (fieldData.type === 'dynamic_fields') {
      newField.children = fieldData.dynamicChildren || '';
    }

    onAddField(parentPath, newField);
    handleClose();
  }, [fieldData, validate, onAddField, parentPath]);

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpen}
        size="small"
      >
        Add Field
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Field</DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-1 gap-4 mt-2">
            <TextField
              label="ID"
              name="id"
              value={fieldData.id}
              onChange={handleChange}
              error={!!errors.id}
              helperText={errors.id}
              fullWidth
              required
            />

            <TextField
              label="Title/Label"
              name="title"
              value={fieldData.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
            />

            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Field Type</InputLabel>
              <Select
                name="type"
                value={fieldData.type}
                onChange={handleChange}
                label="Field Type"
                required
              >
                {fieldTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <TextField
              label="Placeholder"
              name="placeholder"
              value={fieldData.placeholder}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Help Text"
              name="help"
              value={fieldData.help}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                name="required"
                checked={fieldData.required}
                onChange={(e) => setFieldData(prev => ({
                  ...prev,
                  required: e.target.checked
                }))}
                className="mr-2"
              />
              <label htmlFor="required">Required Field</label>
            </div>

            {['input', 'email', 'tel'].includes(fieldData.type) && (
              <TextField
                label="Default Value"
                name="defaultValue"
                value={fieldData.defaultValue}
                onChange={handleChange}
                fullWidth
              />
            )}

            {fieldData.type === 'dropdown' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Dropdown Options</h4>
                  <Button 
                    size="small" 
                    onClick={handleAddOption}
                    variant="outlined"
                  >
                    Add Option
                  </Button>
                </div>
                {errors.options && (
                  <FormHelperText error>{errors.options}</FormHelperText>
                )}
                <div className="space-y-2">
                  {fieldData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <TextField
                        label="Label"
                        value={option.label}
                        onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Value"
                        value={option.value}
                        onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                        fullWidth
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveOption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fieldData.type === 'dynamic_dropdown' && (
              <TextField
                label="Dynamic Options Function"
                name="dynamicOptions"
                value={fieldData.dynamicOptions}
                onChange={handleChange}
                error={!!errors.dynamicOptions}
                helperText={errors.dynamicOptions || "JS function that returns options array"}
                fullWidth
                multiline
                rows={3}
                required
              />
            )}

            {fieldData.type === 'dynamic_fields' && (
              <TextField
                label="Dynamic Fields Function"
                name="dynamicChildren"
                value={fieldData.dynamicChildren}
                onChange={handleChange}
                helperText="JS function that returns array of fields"
                fullWidth
                multiline
                rows={3}
              />
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Add Field
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
