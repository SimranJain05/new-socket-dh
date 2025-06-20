import React, { useState, useCallback, useMemo } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks } from '../blockUtils.js';
import { moveItemInNestedArray } from '../moveUtils.js';
import { BlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Typography, 
  Box, 
  Checkbox, 
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';

const updateByIndexPath = (arr, path, updater) => {
  if (path.length === 0) return updater(arr);
  const [head, ...rest] = path;
  return arr.map((item, idx) =>
    idx === head
      ? rest.length
        ? { ...item, children: updateByIndexPath(item.children || [], rest, updater) }
        : updater(item)
      : item
  );
};

export default function BlockOrderPage() {
  const [json, setJson] = useState(JSON.stringify(input, null, 2));
  const [inputArr, setInputArr] = useState(input);
  const [error, setError] = useState(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldConfig, setNewFieldConfig] = useState({
    id: '',
    type: 'text',
    title: '',
    helptext: '',
    placeholder: '',
    required: false,
    options: [],
    defaultValue: ''
  });
  const [selectedPath, setSelectedPath] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});

  const result = useMemo(() => convertToOrderBlocks(inputArr), [inputArr]);

  const handleJsonChange = useCallback((val) => {
    setJson(val);
  }, []);

  const handleJsonBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(json);
      setInputArr(parsed);
      setError(null);
    } catch (e) {
      setError('Invalid JSON');
    }
  }, [json]);

  React.useEffect(() => {
    setJson(JSON.stringify(inputArr, null, 2));
  }, [inputArr]);

  const onBlockEdit = useCallback((indexPath, updatedFields) => {
    setInputArr(prev =>
      updateByIndexPath(prev, indexPath, item => ({
        ...item,
        ...updatedFields
      }))
    );
    setIsAddingField(false);
  }, []);

  const onMove = useCallback((indexPath, direction) => {
    setInputArr(prev => moveItemInNestedArray(prev, indexPath, direction));
  }, []);

  const startAddField = useCallback((fieldType) => {
    setIsAddingField(true);
    setNewFieldConfig({
      id: Array(5)
        .fill('')
        .map(() => String.fromCharCode(97 + Math.floor(Math.random() * 26)))
        .join(''),

      type: fieldType,
      title: `New ${fieldType}`,
      helptext: '',
      placeholder: '',
      required: false,
      options: fieldType === 'dropdown' || fieldType === 'radio' ? [{ label: '', value: '' }] : [],
      defaultValue: ''
    });
  }, []);

  const handleFieldConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewFieldConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddOption = () => {
    setNewFieldConfig(prev => ({
      ...prev,
      options: [...prev.options, { label: '', value: '' }]
    }));
  };

  const handleOptionChange = (index, key, value) => {
    setNewFieldConfig(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [key]: value };
      return { ...prev, options: newOptions };
    });
  };

  const handleDropdownChange = (fieldId, value) => {
    setSelectedValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const addField = () => {
    const fieldToAdd = { ...newFieldConfig };
    if (fieldToAdd.type !== 'dropdown' && fieldToAdd.type !== 'radio') {
      delete fieldToAdd.options;
    }
    if (!fieldToAdd.defaultValue) {
      delete fieldToAdd.defaultValue;
    }

    setInputArr(prev => {
      if (selectedPath.length === 0) {
        return [...prev, fieldToAdd];
      }
      return updateByIndexPath(prev, selectedPath, item => ({
        ...item,
        children: [...(item.children || []), fieldToAdd]
      }));
    });
    setIsAddingField(false);
  };

  const renderFieldPreview = (blockData) => {
    if (!blockData) return null;
    
    switch (blockData.type) {
      case 'dropdown':
        return (
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>{blockData.title}</InputLabel>
            <Select
              label={blockData.title}
              value={selectedValues[blockData.id] || blockData.defaultValue || ''}
              onChange={(e) => handleDropdownChange(blockData.id, e.target.value)}
              IconComponent={ArrowDropDownIcon}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    maxWidth: '100%'
                  }
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left'
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left'
                }
              }}
              sx={{
                '.MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }
              }}
            >
              {blockData.options?.map((option, i) => (
                <MenuItem 
                  key={i} 
                  value={option.value}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    minWidth: '200px'
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormControlLabel
            control={<Checkbox />}
            label={blockData.title}
            sx={{ mt: 2 }}
          />
        );
      case 'radio':
        return (
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">{blockData.title}</Typography>
            <RadioGroup>
              {blockData.options?.map((option, i) => (
                <FormControlLabel 
                  key={i} 
                  value={option.value} 
                  control={<Radio />} 
                  label={option.label} 
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      case 'text':
      case 'input':
        return (
          <TextField
            label={blockData.title}
            placeholder={blockData.placeholder}
            fullWidth
            size="small"
            sx={{ mt: 2 }}
          />
        );
      case 'input_group':
      case 'group':
        return (
          <Box sx={{ 
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 2,
            mt: 2,
            backgroundColor: '#fafafa'
          }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              {blockData.title}
            </Typography>
            {blockData.help && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {blockData.help}
              </Typography>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex w-full h-screen p-4 gap-4">
      {/* Left Panel - JSON Editor */}
      <div className={`${isAddingField ? 'w-1/3' : 'w-1/2'} bg-white rounded-lg shadow p-4 transition-all duration-300`}>
        <Typography variant="h6" gutterBottom>JSON Editor</Typography>
        <JsonEditor 
          value={json} 
          onChange={handleJsonChange} 
          onBlur={handleJsonBlur} 
        />
        {error && <div className="text-red-500 mt-2">{error}</div>}
        
        <Button 
          variant="contained" 
          onClick={() => startAddField('text')}
          fullWidth
          sx={{ mt: 2 }}
          startIcon={<AddIcon />}
        >
          Add New Field
        </Button>
      </div>

      {/* Middle Panel - Field Configuration */}
      {isAddingField && (
        <div className="w-1/3 bg-white rounded-lg shadow p-4 space-y-4 transition-all duration-300">
          <Typography variant="h6">Field Configuration</Typography>
          
          <TextField
            fullWidth
            label="Key (required)"
            name="id"
            value={newFieldConfig.id}
            onChange={handleFieldConfigChange}
            helperText="Unique identifier (snake_case)"
            variant="outlined"
            size="small"
          />
          
          <TextField
            fullWidth
            label="Label (required)"
            name="title"
            value={newFieldConfig.title}
            onChange={handleFieldConfigChange}
            helperText="User-friendly name"
            variant="outlined"
            size="small"
          />
          
          <FormControl fullWidth size="small">
            <InputLabel>Field Type</InputLabel>
            <Select
              name="type"
              value={newFieldConfig.type}
              onChange={handleFieldConfigChange}
              label="Field Type"
            >
              <MenuItem value="text">Text Input</MenuItem>
              <MenuItem value="dropdown">Dropdown</MenuItem>
              <MenuItem value="checkbox">Checkbox</MenuItem>
              <MenuItem value="radio">Radio Group</MenuItem>
              <MenuItem value="group">Field Group</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Help Text (optional)"
            name="helptext"
            value={newFieldConfig.helptext}
            onChange={handleFieldConfigChange}
            helperText="Detailed explanation for users"
            variant="outlined"
            size="small"
            multiline
            rows={2}
          />
          
          {(newFieldConfig.type === 'text' || newFieldConfig.type === 'input') && (
            <TextField
              fullWidth
              label="Placeholder"
              name="placeholder"
              value={newFieldConfig.placeholder}
              onChange={handleFieldConfigChange}
              variant="outlined"
              size="small"
            />
          )}
          
          {(newFieldConfig.type === 'dropdown' || newFieldConfig.type === 'radio') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Options</Typography>
              {newFieldConfig.options.map((option, index) => (
                <Box key={index} display="flex" gap={2} mb={2}>
                  <TextField
                    label="Label"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Value"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>
              ))}
              <Button onClick={handleAddOption} size="small" variant="outlined">
                Add Option
              </Button>
              
              <TextField
                fullWidth
                label="Default Value"
                name="defaultValue"
                value={newFieldConfig.defaultValue}
                onChange={handleFieldConfigChange}
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                helperText="Pre-selected option value"
              />
            </Box>
          )}
          
          <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => setIsAddingField(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={addField}>
              Add Field
            </Button>
          </Box>
        </div>
      )}

      {/* Right Panel - Interactive Preview */}
      <div className={`${isAddingField ? 'w-1/3' : 'w-1/2'} bg-white rounded-lg shadow p-4 transition-all duration-300`}>
        <Typography variant="h6" gutterBottom>Interactive Form Preview</Typography>
        <div className="space-y-4">
          {result.order.map((blockId, i) => {
            const block = result.blocks[blockId];
            return (
              <div key={blockId}>
                <MemoizedBlockTree
                  blockId={blockId}
                  blockData={block.info}
                  childarr={block.childarr}
                  childblocks={block.childblocks}
                  indexPath={[i]}
                  onBlockEdit={onBlockEdit}
                  onMove={onMove}
                  parentLength={inputArr.length}
                />
                <Box sx={{ ml: 2 }}>
                  {renderFieldPreview(block.info)}
                  {block.childarr.length > 0 && (
                    <Box sx={{ 
                      ml: 4, 
                      mt: 2,
                      borderLeft: '2px solid #e0e0e0',
                      paddingLeft: 2
                    }}>
                      {block.childarr.map(childId => {
                        const childBlock = block.childblocks[childId];
                        return (
                          <Box key={childId} sx={{ mt: 2 }}>
                            {renderFieldPreview(childBlock.info)}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MemoizedBlockTree = React.memo(BlockTree, (prevProps, nextProps) => {
  const shouldUpdate = 
    prevProps.blockId !== nextProps.blockId ||
    prevProps.indexPath.join() !== nextProps.indexPath.join() ||
    prevProps.parentLength !== nextProps.parentLength ||
    !isEqual(prevProps.blockData, nextProps.blockData) ||
    !isEqual(prevProps.childarr, nextProps.childarr) ||
    !isEqual(prevProps.childblocks, nextProps.childblocks);

  return !shouldUpdate;
});

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}