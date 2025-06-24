import React, { useRef, useState } from 'react';
import {
    TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem,
    Checkbox, FormControlLabel, RadioGroup, Radio, Button, Paper, FormHelperText, IconButton
} from '@mui/material';
import {
    Edit as EditIcon,
    ContentCopy as ContentCopyIcon,
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';

// The checkDependencies function remains the same.
const checkDependencies = (field, sampleData) => {
    if (!field.dependsOn || !Array.isArray(field.dependsOn.rules) || field.dependsOn.rules.length === 0) {
        return { visible: true, action: 'disable' };
    }
    const { logic, rules } = field.dependsOn;
    const checkRule = (rule) => {
        const targetValue = sampleData[rule.fieldId] ?? '';
        let conditionMet = false;
        switch (rule.condition) {
            case 'isTrue': conditionMet = targetValue === true; break;
            case 'isFalse': conditionMet = targetValue === false; break;
            case 'notEmpty': conditionMet = targetValue !== '' && targetValue !== null && targetValue !== undefined; break;
            case 'isEmpty': conditionMet = targetValue === '' || targetValue === null || targetValue === undefined; break;
            case 'equals': conditionMet = String(targetValue) === String(rule.value); break;
            case 'notEquals': conditionMet = String(targetValue) !== String(rule.value); break;
            case 'contains': conditionMet = String(targetValue).includes(String(rule.value)); break;
            case 'doesNotContain': conditionMet = !String(targetValue).includes(String(rule.value)); break;
            case 'startsWith': conditionMet = String(targetValue).startsWith(String(rule.value)); break;
            case 'endsWith': conditionMet = String(targetValue).endsWith(String(rule.value)); break;
            case 'greaterThan': case 'lessThan': case 'greaterThanOrEqual': case 'lessThanOrEqual': {
                const targetNumber = parseFloat(targetValue);
                const conditionNumber = parseFloat(rule.value);
                if (!isNaN(targetNumber) && !isNaN(conditionNumber)) {
                    if (rule.condition === 'greaterThan') conditionMet = targetNumber > conditionNumber;
                    else if (rule.condition === 'lessThan') conditionMet = targetNumber < conditionNumber;
                    else if (rule.condition === 'greaterThanOrEqual') conditionMet = targetNumber >= conditionNumber;
                    else if (rule.condition === 'lessThanOrEqual') conditionMet = targetNumber <= conditionNumber;
                }
                break;
            }
            case 'customJs':
                try {
                    const func = new Function('data', rule.value);
                    conditionMet = func(sampleData);
                } catch (e) {
                    console.error("Error executing custom JS dependency:", e);
                    conditionMet = false;
                }
                break;
            default: conditionMet = true;
        }
        return conditionMet;
    };
    const ruleResults = rules.map(rule => checkRule(rule));
    let isVisible;
    if (logic === 'OR') {
        isVisible = ruleResults.some(r => r);
    } else {
        isVisible = ruleResults.every(r => r);
    }
    if (isVisible) {
        return { visible: true, action: 'disable' };
    }
    const hasDisableAction = rules.some(rule => rule.action === 'disable');
    if (hasDisableAction) {
        return { visible: false, action: 'disable' };
    }
    const hasHideAction = rules.some(rule => rule.action === 'hide');
    if (hasHideAction) {
        return { visible: false, action: 'hide' };
    }
    return { visible: false, action: 'disable' };
};


const FieldControls = React.memo(({ onEdit, onDuplicate, onDelete, onMove, canMoveUp, canMoveDown }) => (
  <Box
    className="field-controls"
    sx={{
      position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5, backgroundColor: 'white',
      borderRadius: 1, padding: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      opacity: 0, transition: 'opacity 0.2s ease-in-out', zIndex: 10
    }}
  >
    <IconButton size="small" title="Move Up" onClick={(e) => { e.stopPropagation(); onMove('up'); }} disabled={!canMoveUp}><ArrowUpwardIcon fontSize="inherit" /></IconButton>
    <IconButton size="small" title="Move Down" onClick={(e) => { e.stopPropagation(); onMove('down'); }} disabled={!canMoveDown}><ArrowDownwardIcon fontSize="inherit" /></IconButton>
    <IconButton size="small" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}><EditIcon fontSize="inherit" /></IconButton>
    <IconButton size="small" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><ContentCopyIcon fontSize="inherit" /></IconButton>
    <IconButton size="small" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}><DeleteIcon fontSize="inherit" color="error" /></IconButton>
  </Box>
));

const FieldRenderer = React.memo(function FieldRenderer({ field, indexPath, arrayLength, callbacks }) {
    const { onOpenInputBuilderForEdit, onMoveField, onDeleteField, onDuplicateField, onSelectField, selectedFieldId, sampleData, onSampleDataChange, onReorderFields } = callbacks;
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    if (!field) return null;

    const { visible: isEnabled, action } = checkDependencies(field, sampleData);
    const isSelected = selectedFieldId === field.id;
    
    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({sourcePath: indexPath}));
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const data = e.dataTransfer.getData('text/plain');
        if (data) {
            const { sourcePath } = JSON.parse(data);
            if (sourcePath.length === indexPath.length) {
                onReorderFields(sourcePath[sourcePath.length - 1], indexPath[indexPath.length - 1]);
            }
        }
    };

    const fieldWrapperSx = {
        position: 'relative', p: '1px', my: 1, borderRadius: 2, border: '2px solid',
        borderColor: isSelected ? 'primary.main' : isDraggingOver ? 'primary.light' : 'transparent',
        cursor: 'grab',
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, opacity 0.3s',
        display: !isEnabled && action === 'hide' ? 'none' : 'block',
        opacity: isEnabled ? 1 : 0.6,
        '&:hover': { backgroundColor: 'action.hover', '& > .field-controls': { opacity: 1 } },
    };

    const commonInputProps = {
        label: field.label || field.title, placeholder: field.placeholder,
        helperText: field.help, fullWidth: true, margin: 'normal',
        required: field.required, onClick: (e) => e.stopPropagation(),
        disabled: !isEnabled
    };

    const fieldContent = () => {
        switch (field.type) {
            case 'input': case 'text': case 'email': case 'number': case 'tel':
                return <TextField {...commonInputProps} type={field.type} variant="outlined" value={sampleData[field.id] ?? field.defaultValue ?? ''} onChange={(e) => onSampleDataChange(field.id, e.target.value)} />;
            case 'textarea':
                return <TextField {...commonInputProps} multiline rows={3} variant="outlined" value={sampleData[field.id] ?? field.defaultValue ?? ''} onChange={(e) => onSampleDataChange(field.id, e.target.value)} />;
            case 'dropdown':
                return (<FormControl fullWidth margin="normal" required={field.required} variant="outlined" onClick={(e) => e.stopPropagation()} disabled={!isEnabled}><InputLabel>{field.label || field.title}</InputLabel><Select value={sampleData[field.id] ?? field.defaultValue ?? ''} onChange={(e) => onSampleDataChange(field.id, e.target.value)} label={field.label || field.title}>{Array.isArray(field.options) && field.options.map((opt, i) => <MenuItem key={i} value={opt.value}>{opt.label}</MenuItem>)}</Select>{field.help && <FormHelperText>{field.help}</FormHelperText>}</FormControl>);
            case 'radio_group':
                 return (<FormControl component="fieldset" margin="normal" required={field.required} sx={{ width: '100%', p: 2, border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: 1 }} onClick={(e) => e.stopPropagation()} disabled={!isEnabled}><Typography variant="body1" sx={{ fontWeight: 'medium' }}>{field.label || field.title}</Typography><RadioGroup value={sampleData[field.id] ?? field.defaultValue ?? ''} onChange={(e) => onSampleDataChange(field.id, e.target.value)}>{Array.isArray(field.options) && field.options.map((opt, i) => <FormControlLabel key={i} value={opt.value} control={<Radio />} label={opt.label} />)}</RadioGroup>{field.help && <FormHelperText>{field.help}</FormHelperText>}</FormControl>);
            case 'checkbox':
                return <FormControlLabel control={<Checkbox checked={sampleData[field.id] ?? field.defaultValue ?? false} onChange={(e) => onSampleDataChange(field.id, e.target.checked)} onClick={(e) => e.stopPropagation()} required={field.required} />} label={field.label || field.title} sx={{ my: 1, p: 1, display: 'block' }} disabled={!isEnabled} />;
            case 'date_picker':
                return <TextField {...commonInputProps} type="date" variant="outlined" InputLabelProps={{ shrink: true }} value={sampleData[field.id] ?? field.defaultValue ?? ''} onChange={(e) => onSampleDataChange(field.id, e.target.value)} />;
            case 'attachment':
                return (<Box sx={{ my: 2, p: 1 }}><Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>{field.label || field.title}</Typography><Button variant="outlined" onClick={(e) => e.stopPropagation()} disabled={!isEnabled}>Upload File</Button>{field.help && <FormHelperText>{field.help}</FormHelperText>}</Box>);
            case 'button':
                return <Button variant="contained" sx={{mt: 2}} disabled={!isEnabled}>{field.title || 'Submit'}</Button>
            
            case 'input_group':
                let renderedChildren = null;

                if (field.dynamicChildren) {
                    try {
                        // CORRECTED IMPLEMENTATION:
                        // 1. Create the function from the user's code. This can throw a PARSE error.
                        const dynamicFunc = new Function('data', field.dynamicChildren);
                        
                        // 2. Execute the function. This can throw a RUNTIME error.
                        const dynamicFields = dynamicFunc(sampleData);

                        if (Array.isArray(dynamicFields)) {
                            renderedChildren = dynamicFields.map((child, index) => (
                                <FieldRenderer
                                    key={child.id}
                                    field={child}
                                    indexPath={[...indexPath, index]}
                                    arrayLength={dynamicFields.length}
                                    callbacks={callbacks}
                                />
                            ));
                        } else {
                            renderedChildren = <Typography variant="caption" color="error.main">Dynamic code did not return an array of fields.</Typography>;
                        }
                    } catch (e) {
                        // 3. This single catch handles both parsing and runtime errors gracefully.
                        console.error("Error executing dynamicChildren for field:", field.id, e);
                        renderedChildren = <Typography variant="caption" color="error.main">Error in dynamic fields code: {e.message}</Typography>;
                    }
                } else if (Array.isArray(field.children)) {
                    renderedChildren = field.children.map((child, index) => (
                        <FieldRenderer
                            key={child.id}
                            field={child}
                            indexPath={[...indexPath, index]}
                            arrayLength={field.children.length}
                            callbacks={callbacks}
                        />
                    ));
                }

                return (
                    <>
                        <Typography variant="h6" gutterBottom>{field.title}</Typography>
                        {field.help && <Typography variant="body2" color="text.secondary" gutterBottom>{field.help}</Typography>}
                        <Box sx={{ pl: 2, borderLeft: '2px solid #ddd' }}>
                            {renderedChildren}
                        </Box>
                    </>
                );

            default:
                return <Typography color="error.main" sx={{ my: 2 }}>Unknown field type: {field.type}</Typography>;
        }
    };

    const isDraggable = indexPath.length === 1;

    return (
        <Box
            sx={field.type === 'input_group' ? { ...fieldWrapperSx, p: 2, bgcolor: 'grey.50' } : fieldWrapperSx}
            onClick={() => onSelectField(field.id)}
            component={field.type === 'input_group' ? Paper : Box}
            variant={field.type === 'input_group' ? "outlined" : undefined}
            draggable={isDraggable}
            onDragStart={isDraggable ? handleDragStart : undefined}
            onDrop={isDraggable ? handleDrop : undefined}
            onDragOver={isDraggable ? (e) => e.preventDefault() : undefined}
            onDragEnter={isDraggable ? () => setIsDraggingOver(true) : undefined}
            onDragLeave={isDraggable ? () => setIsDraggingOver(false) : undefined}
        >
            <FieldControls
                onEdit={() => onOpenInputBuilderForEdit(indexPath, field)}
                onDuplicate={() => onDuplicateField(indexPath)}
                onDelete={() => { if (window.confirm(`Are you sure you want to delete "${field.title || field.id}"?`)) onDeleteField(indexPath); }}
                onMove={(dir) => onMoveField(indexPath, dir)}
                canMoveUp={indexPath[indexPath.length - 1] > 0}
                canMoveDown={indexPath[indexPath.length - 1] < arrayLength - 1}
            />
            {fieldContent()}
        </Box>
    );
}, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
});


export default function FormPreview({ fields, ...callbacks }) {
  return (
    <Box>
      {Array.isArray(fields) ? (
        fields.map((field, index) => (
          <FieldRenderer
            key={field.id}
            field={field}
            indexPath={[index]}
            arrayLength={fields.length}
            callbacks={callbacks}
          />
        ))
      ) : (
        <Typography>No fields to display.</Typography>
      )}
    </Box>
  );
}