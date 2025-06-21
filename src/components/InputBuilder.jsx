import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Box, Typography, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function InputBuilder({ onSubmit, onOpenAddDialog, contextPath = [], initialData = null, mode = 'add' }) {
  // mode: 'add' (new field), 'edit' (editing existing field)
  // contextPath: If 'add', this is the path to the parent where the new field goes.
  //              If 'edit', this is the full indexPath of the field being edited.

  const [field, setField] = useState({
    id: '',
    type: 'input',
    title: '', // Display name in preview
    label: '', // Form component label
    placeholder: '',
    help: '',
    required: false,
    defaultValue: '',
    options: [], // For dropdown/radio
    dynamicOptions: '', // For dynamic options (script string)
    children: [], // For input_group children (static array of child objects)
    dynamicChildren: '' // For dynamic children (script string)
  });
  const [optionInput, setOptionInput] = useState({ label: '', value: '' });

  // Use a separate state for child dialog management if needed, but for now, we're relying on parent to open it.
  // const [isChildBuilderOpen, setIsChildBuilderOpen] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      // When editing, populate all fields from initialData
      setField({
        id: initialData.id || '',
        type: initialData.type || 'input',
        title: initialData.title || initialData.label || '', // Prefer title, fallback to label
        label: initialData.label || initialData.title || '', // Prefer label, fallback to title
        placeholder: initialData.placeholder || '',
        help: initialData.help || '',
        required: initialData.required || false,
        defaultValue: initialData.defaultValue || '',
        options: Array.isArray(initialData.options) ? [...initialData.options] : [],
        dynamicOptions: initialData.dynamicOptions || '',
        children: Array.isArray(initialData.children) ? [...initialData.children] : [], // Ensure children are copied
        dynamicChildren: initialData.dynamicChildren || ''
      });
    } else {
      // Reset form when adding new field (initialData is null or mode is 'add')
      setField({
        id: '',
        type: 'input',
        title: '',
        label: '',
        placeholder: '',
        help: '',
        required: false,
        defaultValue: '',
        options: [],
        dynamicOptions: '',
        children: [],
        dynamicChildren: ''
      });
    }
    setOptionInput({ label: '', value: '' }); // Always reset option input
  }, [initialData, mode]);


  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleOptionChange = useCallback((e) => {
    const { name, value } = e.target;
    setOptionInput(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddOption = useCallback(() => {
    if (optionInput.label && optionInput.value) {
      setField(prev => ({
        ...prev,
        options: [...prev.options, { label: optionInput.label, value: optionInput.value }]
      }));
      setOptionInput({ label: '', value: '' });
    }
  }, [optionInput]);

  const handleRemoveOption = useCallback((index) => {
    setField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    // When editing, contextPath is the indexPath of the item.
    // When adding, contextPath is the parentPath where the new item should be added.
    onSubmit(contextPath, field, mode);
  }, [field, onSubmit, contextPath, mode]);

  // This function requests the parent (ActionConfigPage) to open a NEW InputBuilder dialog
  // specifically for adding a child to the current 'input_group' being edited.
  const handleAddSubFieldToGroup = useCallback(() => {
    // The parentPath for the new child will be the 'contextPath' of the *current* InputBuilder,
    // because this InputBuilder represents the parent 'input_group'.
    onOpenAddDialog(contextPath);
  }, [onOpenAddDialog, contextPath]);


  const isInputGroup = field.type === 'input_group';

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="ID *"
        name="id"
        value={field.id}
        onChange={handleChange}
        fullWidth
        size="small"
        required
        InputLabelProps={{ shrink: true }}
        disabled={mode === 'edit'} // ID should not be editable when editing
        helperText={mode === 'edit' ? "ID cannot be changed when editing" : ""}
      />
      <FormControl fullWidth size="small">
        <InputLabel shrink>Field Type</InputLabel>
        <Select
          name="type"
          value={field.type}
          onChange={handleChange}
          label="Field Type"
          displayEmpty
          InputLabelProps={{ shrink: true }}
          disabled={mode === 'edit'} // Type should not be editable when editing
        >
          <MenuItem value="input">Text Input</MenuItem>
          <MenuItem value="email">Email Input</MenuItem>
          <MenuItem value="number">Number Input</MenuItem>
          <MenuItem value="textarea">Text Area</MenuItem>
          <MenuItem value="dropdown">Dropdown</MenuItem>
          <MenuItem value="checkbox">Checkbox</MenuItem>
          <MenuItem value="radio_group">Radio Group</MenuItem>
          <MenuItem value="date_picker">Date Picker</MenuItem>
          <MenuItem value="attachment">Attachment</MenuItem>
          <MenuItem value="input_group">Input Group</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Title (Display Name)"
        name="title"
        value={field.title}
        onChange={handleChange}
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Label (Component Label)"
        name="label"
        value={field.label}
        onChange={handleChange}
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
        helperText="Used by form components. If left empty, Title will be used."
      />
      <TextField
        label="Placeholder"
        name="placeholder"
        value={field.placeholder}
        onChange={handleChange}
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Help Text"
        name="help"
        value={field.help}
        onChange={handleChange}
        fullWidth
        size="small"
        multiline
        rows={2}
        InputLabelProps={{ shrink: true }}
      />
      <FormControlLabel
        control={<Checkbox checked={field.required} onChange={handleChange} name="required" />}
        label="Required Field"
      />
      <TextField
        label="Default Value"
        name="defaultValue"
        value={field.defaultValue}
        onChange={handleChange}
        fullWidth
        size="small"
        InputLabelProps={{ shrink: true }}
      />

      {(field.type === 'dropdown' || field.type === 'radio_group') && (
        <Box sx={{ mt: 2, border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Options</Typography>
          <TextField
            label="Dynamic Options (JS function/API path)"
            name="dynamicOptions"
            value={field.dynamicOptions}
            onChange={handleChange}
            fullWidth
            size="small"
            helperText="e.g., // js function fetchOptions()"
            sx={{ mb: 2 }}
          />
          {field.dynamicOptions === '' && (
            <>
              {field.options.map((opt, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField
                    label="Label"
                    value={opt.label}
                    size="small"
                    sx={{ flexGrow: 1 }}
                    InputProps={{ readOnly: true }} // Make read-only
                  />
                  <TextField
                    label="Value"
                    value={opt.value}
                    size="small"
                    sx={{ flexGrow: 1 }}
                    InputProps={{ readOnly: true }} // Make read-only
                  />
                  <IconButton size="small" onClick={() => handleRemoveOption(index)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <TextField
                  label="New Option Label"
                  name="label"
                  value={optionInput.label}
                  onChange={handleOptionChange}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label="New Option Value"
                  name="value"
                  value={optionInput.value}
                  onChange={handleOptionChange}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button onClick={handleAddOption} variant="outlined" startIcon={<AddIcon />} size="small">
                  Add Option
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}

      {isInputGroup && (
        <Box sx={{ mt: 2, border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Group Children</Typography>
          <TextField
            label="Dynamic Children (JS function/API path)"
            name="dynamicChildren"
            value={field.dynamicChildren}
            onChange={handleChange}
            fullWidth
            size="small"
            helperText="e.g., // js function generateChildren()"
            sx={{ mb: 2 }}
          />
          {field.dynamicChildren === '' && (
            <>
              {field.children.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Existing static children:
                </Typography>
              )}
              {field.children.map((child, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                  - {child.title || child.label || child.id} (Type: {child.type})
                </Typography>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddSubFieldToGroup} // This will now open a *new* dialog for adding a child
                sx={{ mt: 1 }}
              >
                Add New Sub-Field
              </Button>
            </>
          )}
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 2 }}
      >
        {mode === 'edit' ? 'Save Changes' : 'Add Field'}
      </Button>
    </Box>
  );
}