import React, { useState, useCallback } from 'react';
import {
  TextField, Button, Box, Typography, IconButton, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function OptionsBuilder({ options, dynamicOptions, onOptionChange, onDynamicOptionChange, onRemoveOption, onAddOption }) {
  const [optionInput, setOptionInput] = useState({ label: '', value: '' });

  const handleOptionInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setOptionInput(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddOption = useCallback(() => {
    if (optionInput.label && optionInput.value) {
      onAddOption(optionInput);
      setOptionInput({ label: '', value: '' });
    }
  }, [optionInput, onAddOption]);
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle2" gutterBottom>Options</Typography>
      <TextField 
        label="Dynamic Options" 
        value={dynamicOptions} 
        onChange={onDynamicOptionChange} 
        fullWidth 
        size="small" 
        helperText="e.g., JS function or API path that returns an array of {label, value}" 
      />
      {!dynamicOptions && (
        <>
          {options.map((opt, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'center' }}>
              <TextField label="Label" value={opt.label} size="small" fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Value" value={opt.value} size="small" fullWidth InputProps={{ readOnly: true }} />
              <IconButton onClick={() => onRemoveOption(index)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
  );
}
