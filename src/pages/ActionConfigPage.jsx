import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppBar,
  Tabs,
  Tab,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import BlockOrderPage from './BlockOrderPage.jsx';
import InputBuilder from '../components/InputBuilder';
import Chatbot from '../components/Chatbot';
import FormPreview from '../components/FormPreview.jsx';
import { updateByIndexPath, moveItemInNestedArray, flattenFields } from '../utils.js';
import { input } from '../inputData.js';

function a11yProps(index) {
  return { id: `simple-tab-${index}`, 'aria-controls': `simple-tabpanel-${index}` };
}

export default function ActionConfigPage() {
  const [activeTab, setActiveTab] = useState(1);
  const [inputMode, setInputMode] = useState('form');
  const [fields, setFields] = useState(input);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [sampleData, setSampleData] = useState({});

  // State to manage the left panel's mode ('add' or 'edit')
  const [panelMode, setPanelMode] = useState('add');
  // State to hold the data for the field being edited
  const [fieldToEdit, setFieldToEdit] = useState(null);

  const allFieldsFlat = useMemo(() => flattenFields(fields), [fields]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFieldId) return;
      const findPath = (nodes, id, currentPath = []) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const newPath = [...currentPath, i];
          if (node.id === id) return newPath;
          if (Array.isArray(node.children)) {
            const foundPath = findPath(node.children, id, newPath);
            if (foundPath) return foundPath;
          }
        }
        return null;
      };
      const path = findPath(fields, selectedFieldId);
      if (!path) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? 'up' : 'down';
        setFields(prev => moveItemInNestedArray(prev, path, direction));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, fields]);

  const handleTabChange = useCallback((event, newValue) => setActiveTab(newValue), []);
  const handleInputModeChange = useCallback((event) => setInputMode(event.target.value), []);
  
  // This function now sets the left panel to edit mode
  const handleSelectFieldForEdit = useCallback((indexPath, fieldData) => {
    setPanelMode('edit');
    setFieldToEdit({ indexPath, fieldData });
    setSelectedFieldId(fieldData.id); // Also select the field in the preview
  }, []);

  const handleSetPanelToAddMode = useCallback(() => {
    setPanelMode('add');
    setFieldToEdit(null);
    setSelectedFieldId(null);
  }, []);
  
  const handleSampleDataChange = useCallback((fieldId, value) => {
    setSampleData(prevData => ({ ...prevData, [fieldId]: value }));
  }, []);

  const handleInputBuilderSubmit = useCallback((submittedPath, fieldData, mode) => {
    const processedField = { ...fieldData, label: fieldData.label || fieldData.title, children: Array.isArray(fieldData.children) ? fieldData.children : [] };
    setFields(prevFields => {
      if (mode === 'edit') return updateByIndexPath(prevFields, submittedPath, () => processedField);
      if (submittedPath.length === 0) return [...prevFields, processedField];
      return updateByIndexPath(prevFields, submittedPath, (parent) => ({ ...parent, children: [...(Array.isArray(parent.children) ? parent.children : []), processedField] }));
    });
    // After submit, switch back to add mode
    handleSetPanelToAddMode();
  }, [handleSetPanelToAddMode]);

  const handleMoveField = useCallback((indexPath, direction) => {
    setFields(prev => moveItemInNestedArray(prev, indexPath, direction));
  }, []);

  const handleDeleteField = useCallback((indexPath) => {
    setFields(prev => {
      if (indexPath.length === 1) return prev.filter((_, i) => i !== indexPath[0]);
      return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => ({ ...parent, children: parent.children.filter((_, i) => i !== indexPath.at(-1)) }));
    });
  }, []);

  const handleDuplicateField = useCallback((indexPath) => {
    setFields(prev => {
        const parentPath = indexPath.slice(0, -1);
        const indexToDuplicate = indexPath[indexPath.length - 1];
        if (parentPath.length === 0) {
            const itemToDuplicate = prev[indexToDuplicate];
            if (!itemToDuplicate) return prev;
            const duplicate = { ...itemToDuplicate, id: `${itemToDuplicate.id}-copy-${Date.now()}` };
            const newArr = [...prev];
            newArr.splice(indexToDuplicate + 1, 0, duplicate);
            return newArr;
        }
        return updateByIndexPath(prev, parentPath, (parent) => {
            const itemToDuplicate = parent.children[indexToDuplicate];
            if (!itemToDuplicate) return parent;
            const duplicate = { ...itemToDuplicate, id: `${itemToDuplicate.id}-copy-${Date.now()}` };
            const newChildren = [...parent.children];
            newChildren.splice(indexToDuplicate + 1, 0, duplicate);
            return { ...parent, children: newChildren };
        });
    });
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', width: '100%', borderRight: '1px solid #ddd' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #ddd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <Typography variant="h5" sx={{ flexGrow: 1, ml: 2 }}>Action Name</Typography>
            <Button variant="contained" color="primary" sx={{ mr: 1 }}>Save</Button>
            <Button variant="outlined" color="primary">Publish</Button>
          </Box>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Input Configuration" {...a11yProps(1)} />
            <Tab label="API" {...a11yProps(2)} />
          </Tabs>
        </AppBar>
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, flexShrink: 0 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>Input Mode</Typography>
                <RadioGroup row value={inputMode} onChange={handleInputModeChange}>
                  <FormControlLabel value="form" control={<Radio size="small" />} label="Form builder" />
                  <FormControlLabel value="json" control={<Radio size="small" />} label="JSON editor" />
                </RadioGroup>
              </Paper>
              
              {inputMode === 'form' && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                    <Typography variant="h6">{panelMode === 'add' ? 'Add New Field' : 'Edit Field'}</Typography>
                    {panelMode === 'edit' && (
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={handleSetPanelToAddMode}>
                        Add a New Field Instead
                      </Button>
                    )}
                  </Box>
                  <Divider sx={{mb: 2}} />
                  <InputBuilder
                    key={fieldToEdit ? fieldToEdit.fieldData.id : 'add-new'} // Force re-render when switching fields
                    onSubmit={handleInputBuilderSubmit}
                    onOpenAddDialog={() => { /* This is for nested groups, may need adjustment later */ }}
                    contextPath={fieldToEdit ? fieldToEdit.indexPath : []}
                    initialData={fieldToEdit ? fieldToEdit.fieldData : null}
                    mode={panelMode}
                    allFields={allFieldsFlat}
                  />
                </Paper>
              )}
              
              {inputMode === 'json' && (
                <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, px: 1 }}>Edit raw JSON for adding fields.</Typography>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden', border: '1px solid #ddd', borderRadius: 1 }}>
                    <BlockOrderPage showJsonEditorOnly={true} fields={fields} onFieldsChange={setFields} />
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', p: 2, overflowY: 'auto', borderRight: '1px solid #ddd' }}>
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>Input Fields Preview</Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, bgcolor: '#f7f7f7', border: '1px solid #ddd', borderRadius: 1 }}>
          <FormPreview
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onOpenInputBuilderForEdit={handleSelectFieldForEdit} // Re-wired to the new handler
            onMoveField={handleMoveField}
            onDeleteField={handleDeleteField}
            onDuplicateField={handleDuplicateField}
            sampleData={sampleData}
            onSampleDataChange={handleSampleDataChange}
          />
        </Box>
      </Box>

      <Box sx={{ flex: 0.8, flexShrink: 0, p: 2, bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
        <Chatbot />
      </Box>
    </Box>
  );
}
