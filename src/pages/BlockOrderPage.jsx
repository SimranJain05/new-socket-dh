import React, { useState, useCallback, useMemo } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks } from '../blockUtils.js';
import { moveItemInNestedArray } from '../moveUtils.js';
import { BlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';
import { TextField, Select, MenuItem, FormControl, InputLabel, Button, Typography, Box } from '@mui/material';

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
    options: []
  });
  const [selectedPath, setSelectedPath] = useState([]);

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
      id: `field_${Date.now()}`,
      type: fieldType,
      title: `New ${fieldType}`,
      helptext: '',
      placeholder: '',
      required: false,
      options: fieldType === 'dropdown' ? [{ label: '', value: '' }] : []
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

  const addField = () => {
    const fieldToAdd = { ...newFieldConfig };
    if (fieldToAdd.type !== 'dropdown') {
      delete fieldToAdd.options;
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

  return (
    <div className="flex w-full h-screen p-4 gap-4">
      {/* Left Panel - JSON Editor */}
      <div className="w-1/4 bg-white rounded-lg shadow p-4">
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
        >
          Add New Field
        </Button>
      </div>

      {/* Middle Panel - Field Configuration */}
      {isAddingField && (
        <div className="w-1/3 bg-white rounded-lg shadow p-4 space-y-4">
          <Typography variant="h6">Field Configuration</Typography>
          
          <TextField
            fullWidth
            label="Key (required)"
            name="id"
            value={newFieldConfig.id}
            onChange={handleFieldConfigChange}
            helperText="Enter a unique identifier using snake_case"
            variant="outlined"
            size="small"
          />
          
          <TextField
            fullWidth
            label="Label (required)"
            name="title"
            value={newFieldConfig.title}
            onChange={handleFieldConfigChange}
            helperText="User-friendly name displayed to users"
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
          
          <TextField
            fullWidth
            label="Placeholder"
            name="placeholder"
            value={newFieldConfig.placeholder}
            onChange={handleFieldConfigChange}
            variant="outlined"
            size="small"
          />
          
          {newFieldConfig.type === 'dropdown' && (
            <Box>
              <Typography variant="subtitle2">Options</Typography>
              {newFieldConfig.options.map((option, index) => (
                <Box key={index} display="flex" gap={2} mb={2}>
                  <TextField
                    label="Label"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    size="small"
                  />
                  <TextField
                    label="Value"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    size="small"
                  />
                </Box>
              ))}
              <Button onClick={handleAddOption} size="small">Add Option</Button>
            </Box>
          )}
          
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => setIsAddingField(false)}>Cancel</Button>
            <Button variant="contained" onClick={addField}>Add Field</Button>
          </Box>
        </div>
      )}

      {/* Right Panel - Block Tree */}
      <div className={`${isAddingField ? 'w-5/12' : 'w-3/4'} bg-white rounded-lg shadow p-4`}>
        <Typography variant="h6" gutterBottom>Rendered Block Tree</Typography>
        <div className="h-full">
          {result.order.map((blockId, i) => {
            const block = result.blocks[blockId];
            return (
              <MemoizedBlockTree
                key={blockId}
                blockId={blockId}
                blockData={block.info}
                childarr={block.childarr}
                childblocks={block.childblocks}
                indexPath={[i]}
                onBlockEdit={onBlockEdit}
                onMove={onMove}
                parentLength={inputArr.length}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Optimized memoization with proper prop comparison
const MemoizedBlockTree = React.memo(BlockTree, (prevProps, nextProps) => {
  // Only re-render if block data or position changes
  const shouldUpdate = 
    prevProps.blockId !== nextProps.blockId ||
    prevProps.indexPath.join() !== nextProps.indexPath.join() ||
    prevProps.parentLength !== nextProps.parentLength ||
    !isEqual(prevProps.blockData, nextProps.blockData) ||
    !isEqual(prevProps.childarr, nextProps.childarr) ||
    !isEqual(prevProps.childblocks, nextProps.childblocks);

  return !shouldUpdate;
});

// Simple shallow comparison helper
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}