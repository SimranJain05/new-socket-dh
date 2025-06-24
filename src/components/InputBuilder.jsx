import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Box, Typography, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import OptionsBuilder from './OptionsBuilder.jsx';
import DependencyBuilder from './DependencyBuilder.jsx';

const InputBuilder = React.memo(function InputBuilder({
  onSubmit,
  onOpenAddDialog,
  contextPath = [],
  initialData = null,
  mode = 'add',
  allFields = []
}) {
  const [field, setField] = useState({
    id: '', type: 'input', title: '', label: '', placeholder: '',
    help: '', required: false, defaultValue: '', options: [],
    dynamicOptions: '', children: [], dynamicChildren: '', dependsOn: { logic: 'AND', rules: [], action: 'disable' }
  });

  useEffect(() => {
    const defaultState = {
      id: '', type: 'input', title: '', label: '', placeholder: '',
      help: '', required: false, defaultValue: '', options: [],
      dynamicOptions: '', children: [], dynamicChildren: '', dependsOn: { logic: 'AND', rules: [], action: 'disable' }
    };
    if (initialData && mode === 'edit') {
      const dependsOn = initialData.dependsOn;
      const newDependsOn = Array.isArray(dependsOn) 
        ? { logic: 'AND', rules: dependsOn, action: 'disable' }
        : (dependsOn || { logic: 'AND', rules: [], action: 'disable' });

      setField({
        ...defaultState,
        ...initialData,
        options: Array.isArray(initialData.options) ? [...initialData.options] : [],
        children: Array.isArray(initialData.children) ? [...initialData.children] : [],
        dependsOn: newDependsOn
      });
    } else {
      setField(defaultState);
    }
  }, [initialData, mode]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // --- All Dependency handlers are now passed down to DependencyBuilder ---
  const handleDependencyLogicChange = useCallback((newLogic) => {
    setField(prev => ({ ...prev, dependsOn: { ...prev.dependsOn, logic: newLogic } }));
  }, []);
  
  const handleDependencyActionChange = useCallback((newAction) => {
    setField(prev => ({ ...prev, dependsOn: { ...prev.dependsOn, action: newAction } }));
  }, []);

  const handleDependencyChange = useCallback((index, prop, value) => {
    setField(prev => {
      const newDependsOn = JSON.parse(JSON.stringify(prev.dependsOn));
      const rule = newDependsOn.rules[index];
      rule[prop] = value;
      if (prop === 'conditionType') {
        rule.condition = ''; // Reset condition when type changes
      }
      return { ...prev, dependsOn: newDependsOn };
    });
  }, []);

  const handleAddDependency = useCallback(() => {
    setField(prev => {
        const newRule = { fieldId: '', conditionType: 'General', condition: 'notEmpty', value: '' };
        const newDependsOn = {
            logic: prev.dependsOn?.logic || 'AND',
            rules: [...(prev.dependsOn?.rules || []), newRule],
            action: prev.dependsOn?.action || 'disable'
        };
        return { ...prev, dependsOn: newDependsOn };
    });
  }, []);

  const handleRemoveDependency = useCallback((index) => {
    setField(prev => {
        const newRules = prev.dependsOn.rules.filter((_, i) => i !== index);
        const newDependsOn = { ...prev.dependsOn, rules: newRules };
        return { ...prev, dependsOn: newDependsOn };
    });
  }, []);

  // --- All Option handlers are now passed down to OptionsBuilder ---
  const handleAddOption = useCallback((newOption) => {
    setField(prev => ({ ...prev, options: [...prev.options, newOption] }));
  }, []);

  const handleRemoveOption = useCallback((index) => {
    setField(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  }, []);

  const handleDynamicOptionChange = useCallback((e) => {
    setField(prev => ({ ...prev, dynamicOptions: e.target.value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(contextPath, field, mode);
  }, [onSubmit, contextPath, field]);

  const handleAddSubFieldToGroup = useCallback(() => {
    onOpenAddDialog(contextPath);
  }, [onOpenAddDialog, contextPath]);

  const isInputGroup = field.type === 'input_group';
  const availableDependencyFields = useMemo(() => allFields.filter(f => f.id !== field.id), [allFields, field.id]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <TextField label="ID *" name="id" value={field.id} onChange={handleChange} fullWidth size="small" required disabled={mode === 'edit'} />
      <FormControl fullWidth size="small">
        <InputLabel shrink>Field Type</InputLabel>
        <Select name="type" value={field.type} onChange={handleChange} label="Field Type" disabled={mode === 'edit'}>
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
      <TextField label="Title" name="title" value={field.title} onChange={handleChange} fullWidth size="small" />
      <TextField label="Label" name="label" value={field.label} onChange={handleChange} fullWidth size="small" />
      <TextField label="Placeholder" name="placeholder" value={field.placeholder} onChange={handleChange} fullWidth size="small" />
      <TextField label="Help Text" name="help" value={field.help} onChange={handleChange} fullWidth size="small" multiline rows={2} />
      <FormControlLabel control={<Checkbox checked={field.required} onChange={handleChange} name="required" />} label="Required" />
      <TextField label="Default Value" name="defaultValue" value={field.defaultValue} onChange={handleChange} fullWidth size="small" />

      {(field.type === 'dropdown' || field.type === 'radio_group') && (
        <OptionsBuilder 
            options={field.options}
            dynamicOptions={field.dynamicOptions}
            onAddOption={handleAddOption}
            onRemoveOption={handleRemoveOption}
            onDynamicOptionChange={handleDynamicOptionChange}
        />
      )}

      <DependencyBuilder 
        dependsOn={field.dependsOn}
        allFields={availableDependencyFields}
        onDependencyChange={handleDependencyChange}
        onAddDependency={handleAddDependency}
        onRemoveDependency={handleRemoveDependency}
        onLogicChange={handleDependencyLogicChange}
        onActionChange={handleDependencyActionChange}
      />

      {isInputGroup && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2">Group Children</Typography>
          <TextField
            label="Dynamic Children"
            name="dynamicChildren"
            value={field.dynamicChildren}
            onChange={handleChange}
            fullWidth
            size="small"
            helperText="e.g., JS function for generating children"
          />
          {field.dynamicChildren === '' && (
            <>
              {field.children.map((child, idx) => (
                <Typography key={idx} variant="body2" sx={{ ml: 2 }}>- {child.title || child.label || child.id}</Typography>
              ))}
              <Button onClick={handleAddSubFieldToGroup} variant="outlined" sx={{ mt: 1 }} startIcon={<AddIcon />}>Add Sub-Field</Button>
            </>
          )}
        </Paper>
      )}

      <Button onClick={handleSubmit} variant="contained" color="primary" sx={{mt: 2}}>{mode === 'edit' ? 'Save Changes' : 'Add Field'}</Button>
    </Box>
  );
});

export default InputBuilder;
