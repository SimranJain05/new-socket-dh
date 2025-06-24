import React from 'react';
import {
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Box, Typography, IconButton, Paper, RadioGroup, Radio, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { conditionsRequiringValue, conditionGroups } from '../constants/conditions.js';

export default function DependencyBuilder({ dependsOn, allFields, onDependencyChange, onAddDependency, onRemoveDependency, onLogicChange, onActionChange }) {

  if (allFields.length === 0) {
    return (
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Field Dependencies</Typography>
            <Typography variant="caption" display="block" sx={{mt: 1, color: 'text.secondary'}}>
                No other fields are available to create a dependency. Add more fields to the form first.
            </Typography>
        </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Field Dependencies</Typography>
        <Typography variant="caption" display="block" sx={{mb: 2}}>
            Make this field appear only when certain conditions are met.
        </Typography>

        {(dependsOn?.rules?.length > 0) && (
            <Box>
                <FormControl component="fieldset" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>If conditions are not met:</Typography>
                    <RadioGroup row value={dependsOn.action || 'disable'} onChange={(e) => onActionChange(e.target.value)}>
                        <FormControlLabel value="disable" control={<Radio size="small"/>} label="Disable field" />
                        <FormControlLabel value="hide" control={<Radio size="small"/>} label="Hide field" />
                    </RadioGroup>
                </FormControl>

                <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Show this field if:</Typography>
                    <RadioGroup row value={dependsOn.logic} onChange={(e) => onLogicChange(e.target.value)}>
                        <FormControlLabel value="AND" control={<Radio size="small"/>} label="All conditions are met (AND)" />
                        <FormControlLabel value="OR" control={<Radio size="small"/>} label="Any condition is met (OR)" />
                    </RadioGroup>
                </FormControl>
            </Box>
        )}
        
        {Array.isArray(dependsOn?.rules) && dependsOn.rules.map((dep, index) => (
            <Box key={index} sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1, mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{minWidth: 120, flexGrow: 1}}>
                        <InputLabel>Field</InputLabel>
                        <Select value={dep.fieldId} onChange={(e) => onDependencyChange(index, 'fieldId', e.target.value)} label="Field">
                            {allFields.map(f => <MenuItem key={f.id} value={f.id}>{f.title}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{minWidth: 120, flexGrow: 1}}>
                        <InputLabel>Type</InputLabel>
                        <Select value={dep.conditionType || 'General'} onChange={(e) => onDependencyChange(index, 'conditionType', e.target.value)} label="Type">
                            {Object.keys(conditionGroups).map(groupName => (
                                <MenuItem key={groupName} value={groupName}>{groupName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {(dep.conditionType || 'General') !== 'Custom' && (
                        <FormControl size="small" sx={{minWidth: 150, flexGrow: 1}}>
                            <InputLabel>Condition</InputLabel>
                            <Select value={dep.condition} onChange={(e) => onDependencyChange(index, 'condition', e.target.value)} label="Condition">
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
                            onChange={(e) => onDependencyChange(index, 'value', e.target.value)}
                            sx={{flexGrow: 1}}
                        />
                    )}
                     <IconButton onClick={() => onRemoveDependency(index)} color="error" sx={{ ml: 'auto' }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
                {(dep.conditionType === 'Custom') && (
                     <TextField
                        label="Custom JavaScript Condition"
                        multiline
                        rows={4}
                        placeholder="e.g., return data['salary'] > 50000;"
                        value={dep.value}
                        onChange={(e) => onDependencyChange(index, 'value', e.target.value)}
                        sx={{width: '100%', mt: 2, fontFamily: 'monospace' }}
                        helperText="The function must return true or false. Use data['field_id'] to access other field values."
                    />
                )}
            </Box>
        ))}
        
        <Button onClick={onAddDependency} startIcon={<AddIcon />} sx={{mt: 2}}>
            Add Dependency Rule
        </Button>
    </Paper>
  );
}
