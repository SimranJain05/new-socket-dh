import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, Box, Typography, IconButton, Paper, RadioGroup, Radio
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Expanded list of conditions that require a value input field.
const conditionsRequiringValue = [
  'equals', 'notEquals',
  'greaterThan', 'lessThan',
  'greaterThanOrEqual', 'lessThanOrEqual',
  'contains', 'doesNotContain',
  'startsWith', 'endsWith'
];

// Group conditions by type for the new two-step selection process.
const conditionGroups = {
  'General': [
    { value: 'notEmpty', label: 'Is not empty' },
    { value: 'isEmpty', label: 'Is empty' },
  ],
  'Text': [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'doesNotContain', label: 'Does not contain' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
  ],
  'Number': [
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equal to' },
    { value: 'lessThanOrEqual', label: 'Less than or equal to' },
  ],
  'Boolean': [
    { value: 'isTrue', label: 'Is true' },
    { value: 'isFalse', label: 'Is false' },
  ],
  'Custom': [
    { value: 'customJs', label: 'Custom JavaScript' },
  ]
};

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

  const [optionInput, setOptionInput] = useState({ label: '', value: '' });

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
    setOptionInput({ label: '', value: '' });
  }, [initialData, mode]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleDependencyLogicChange = useCallback((newLogic) => {
    setField(prev => ({
        ...prev,
        dependsOn: { ...prev.dependsOn, logic: newLogic }
    }));
  }, []);
  
  const handleDependencyActionChange = useCallback((newAction) => {
    setField(prev => ({
        ...prev,
        dependsOn: { ...prev.dependsOn, action: newAction }
    }));
  }, []);

  const handleDependencyChange = useCallback((index, prop, value) => {
    setField(prev => {
      const newDependsOn = JSON.parse(JSON.stringify(prev.dependsOn));
      const rule = newDependsOn.rules[index];
      rule[prop] = value;

      if (prop === 'conditionType') {
        const newConditionGroup = conditionGroups[value] || [];
        rule.condition = newConditionGroup.length > 0 ? newConditionGroup[0].value : '';
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

  const handleOptionInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setOptionInput(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddOption = useCallback(() => {
    if (optionInput.label && optionInput.value) {
      setField(prev => ({
        ...prev,
        options: [...prev.options, { ...optionInput }]
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
    onSubmit(contextPath, field, mode);
  }, [onSubmit, contextPath, field, mode]);

  const handleAddSubFieldToGroup = useCallback(() => {
    onOpenAddDialog(contextPath);
  }, [onOpenAddDialog, contextPath]);

  const isInputGroup = field.type === 'input_group';

  const availableDependencyFields = useMemo(() =>
    allFields.filter(f => f.id !== field.id),
    [allFields, field.id]
  );

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

      {/* Options Builder */}
      {(field.type === 'dropdown' || field.type === 'radio_group') && (
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Options</Typography>
          <TextField label="Dynamic Options" name="dynamicOptions" value={field.dynamicOptions} onChange={handleChange} fullWidth size="small" helperText="e.g., JS function or API path" />
          {!field.dynamicOptions && (
            <>
              {field.options.map((opt, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'center' }}>
                  <TextField label="Label" value={opt.label} size="small" fullWidth InputProps={{ readOnly: true }} />
                  <TextField label="Value" value={opt.value} size="small" fullWidth InputProps={{ readOnly: true }} />
                  <IconButton onClick={() => handleRemoveOption(index)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField label="New Option Label" name="label" value={optionInput.label} onChange={handleOptionInputChange} size="small" fullWidth />
                <TextField label="New Option Value" name="value" value={optionInput.value} onChange={handleOptionInputChange} size="small" fullWidth />
                <Button onClick={handleAddOption} variant="outlined" size="small" startIcon={<AddIcon />}>Add</Button>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Dependencies Builder */}
      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Field Dependencies</Typography>
        
        {availableDependencyFields.length === 0 ? (
            <Typography variant="caption" display="block" sx={{mt: 1, color: 'text.secondary'}}>
                No other fields are available to create a dependency. Add more fields to the form first.
            </Typography>
        ) : (
            <>
                 {(field.dependsOn?.rules?.length > 0) &&
                    <Box>
                         <FormControl component="fieldset" sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>If conditions are not met:</Typography>
                            <RadioGroup row value={field.dependsOn.action || 'disable'} onChange={(e) => handleDependencyActionChange(e.target.value)}>
                                <FormControlLabel value="disable" control={<Radio size="small"/>} label="Disable field" />
                                <FormControlLabel value="hide" control={<Radio size="small"/>} label="Hide field" />
                            </RadioGroup>
                        </FormControl>

                        <FormControl component="fieldset" sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Show this field if:</Typography>
                            <RadioGroup row value={field.dependsOn.logic} onChange={(e) => handleDependencyLogicChange(e.target.value)}>
                                <FormControlLabel value="AND" control={<Radio size="small"/>} label="All conditions are met (AND)" />
                                <FormControlLabel value="OR" control={<Radio size="small"/>} label="Any condition is met (OR)" />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                }
                
                {Array.isArray(field.dependsOn?.rules) && field.dependsOn.rules.map((dep, index) => (
                    <Box key={index} sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{minWidth: 120, flexGrow: 1}}>
                                <InputLabel>Field</InputLabel>
                                <Select value={dep.fieldId} onChange={(e) => handleDependencyChange(index, 'fieldId', e.target.value)} label="Field">
                                    {availableDependencyFields.map(f => <MenuItem key={f.id} value={f.id}>{f.title}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{minWidth: 120, flexGrow: 1}}>
                                <InputLabel>Type</InputLabel>
                                <Select value={dep.conditionType || 'General'} onChange={(e) => handleDependencyChange(index, 'conditionType', e.target.value)} label="Type">
                                    {Object.keys(conditionGroups).map(groupName => (
                                        <MenuItem key={groupName} value={groupName}>{groupName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {(dep.conditionType || 'General') !== 'Custom' && (
                                <FormControl size="small" sx={{minWidth: 150, flexGrow: 1}}>
                                    <InputLabel>Condition</InputLabel>
                                    <Select value={dep.condition} onChange={(e) => handleDependencyChange(index, 'condition', e.target.value)} label="Condition">
                                        {(conditionGroups[dep.conditionType || 'General'] || []).map(cond => (
                                            <MenuItem key={cond.value} value={cond.value}>{cond.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            
                            {conditionsRequiringValue.includes(dep.condition) && (
                                <TextField
                                    label="Value"
                                    size="small"
                                    type={dep.condition.toLowerCase().includes('than') ? 'number' : 'text'}
                                    value={dep.value}
                                    onChange={(e) => handleDependencyChange(index, 'value', e.target.value)}
                                    sx={{flexGrow: 1}}
                                />
                            )}
                             <IconButton onClick={() => handleRemoveDependency(index)} color="error" sx={{ ml: 'auto' }}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                        {(dep.conditionType === 'Custom') && (
                             <TextField
                                label="Custom JavaScript Condition"
                                multiline
                                rows={4}
                                placeholder="e.g., return data['salary'] > 50000;"
                                value={dep.value}
                                onChange={(e) => handleDependencyChange(index, 'value', e.target.value)}
                                sx={{width: '100%', mt: 2, fontFamily: 'monospace' }}
                                helperText="The function must return true or false. Use data['field_id'] to access other field values."
                            />
                        )}
                    </Box>
                ))}
                
                <Button onClick={handleAddDependency} startIcon={<AddIcon />} sx={{mt: 2}}>
                    Add Dependency
                </Button>
            </>
        )}
      </Paper>

      {isInputGroup && (
        <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
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
        </Box>
      )}

      <Button onClick={handleSubmit} variant="contained" color="primary" sx={{mt: 2}}>{mode === 'edit' ? 'Save Changes' : 'Add Field'}</Button>
    </Box>
  );
});

export default InputBuilder;
