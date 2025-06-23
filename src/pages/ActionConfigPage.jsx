// pages/ActionConfigPage.jsx

// I've added useMemo to the React import
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon, Save as SaveIcon, Close as CloseIcon, ContentCopy as ContentCopyIcon, Delete as DeleteIcon,
  Add as AddIcon, ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

import BlockOrderPage from './BlockOrderPage.jsx';
import InputBuilder from '../components/InputBuilder';
import Chatbot from '../components/Chatbot';
import FormPreview from '../components/FormPreview.jsx';
// Ensure flattenFields is imported from utils.js
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

  const [isInputBuilderOpen, setIsInputBuilderOpen] = useState(false);
  const [inputBuilderContextPath, setInputBuilderContextPath] = useState([]);
  const [inputBuilderInitialData, setInputBuilderInitialData] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');

  // --- CHANGE #1: ADD THIS LINE ---
  // This creates a flat list of all available fields to be passed to the dialog.
  const allFieldsFlat = useMemo(() => flattenFields(fields), [fields]);

  // Keyboard navigation now works correctly for nested fields
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

  const handleOpenInputBuilderForAdd = useCallback((parentPath = []) => {
    setInputBuilderInitialData(null);
    setInputBuilderContextPath(parentPath);
    setDialogMode('add');
    setIsInputBuilderOpen(true);
  }, []);

  const handleOpenInputBuilderForEdit = useCallback((indexPath, fieldData) => {
    setInputBuilderInitialData(fieldData);
    setInputBuilderContextPath(indexPath);
    setDialogMode('edit');
    setIsInputBuilderOpen(true);
  }, []);

  const handleCloseInputBuilder = useCallback(() => {
    setIsInputBuilderOpen(false);
  }, []);
  
  const handleSampleDataChange = useCallback((fieldId, value) => {
    setSampleData(prevData => ({ ...prevData, [fieldId]: value }));
  }, []);

  const [addFieldForm, setAddFieldForm] = useState({
    title: '', placeholder: '', help: '', id: '', defaultValue: '', required: false, type: 'TextField'
  });

  const handleAddFieldFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setAddFieldForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleAddFieldFormSubmit = useCallback(() => {
    const newField = {
      id: addFieldForm.id || `field-${Date.now()}`, type: 'input', label: addFieldForm.title,
      title: addFieldForm.title, required: addFieldForm.required, placeholder: addFieldForm.placeholder,
      defaultValue: addFieldForm.defaultValue, children: []
    };
    setFields(prev => [...prev, newField]);
    setAddFieldForm({ title: '', placeholder: '', help: '', id: '', defaultValue: '', required: false, type: 'TextField' });
  }, [addFieldForm]);

  const handleInputBuilderSubmit = useCallback((submittedPath, fieldData, mode) => {
    const processedField = { ...fieldData, label: fieldData.label || fieldData.title, children: Array.isArray(fieldData.children) ? fieldData.children : [] };
    setFields(prevFields => {
      if (mode === 'edit') return updateByIndexPath(prevFields, submittedPath, () => processedField);
      if (submittedPath.length === 0) return [...prevFields, processedField];
      return updateByIndexPath(prevFields, submittedPath, (parent) => ({ ...parent, children: [...(Array.isArray(parent.children) ? parent.children : []), processedField] }));
    });
    handleCloseInputBuilder();
  }, [handleCloseInputBuilder]);

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
      let list = prev, itemToDuplicate = null;
      for (let i = 0; i < indexPath.length; i++) {
        const index = indexPath[i];
        if (i === indexPath.length - 1) itemToDuplicate = list[index];
        else list = list[index].children;
      }
      if (!itemToDuplicate) return prev;
      const duplicate = { ...itemToDuplicate, id: `${itemToDuplicate.id}-copy-${Date.now()}` };
      if (indexPath.length === 1) {
        const newArr = [...prev]; newArr.splice(indexPath[0] + 1, 0, duplicate); return newArr;
      }
      return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => {
        const newChildren = [...parent.children]; newChildren.splice(indexPath.at(-1) + 1, 0, duplicate); return { ...parent, children: newChildren };
      });
    });
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', width: '100%', borderRight: '1px solid #ddd' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #ddd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}><Typography variant="h5" sx={{ flexGrow: 1, ml: 2 }}>Action Name</Typography><Button variant="contained" color="primary" sx={{ mr: 1 }}>Save</Button><Button variant="outlined" color="primary">Publish</Button></Box>
          <Tabs value={activeTab} onChange={handleTabChange}><Tab label="Overview" {...a11yProps(0)} /><Tab label="Input Configuration" {...a11yProps(1)} /><Tab label="API" {...a11yProps(2)} /></Tabs>
        </AppBar>
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          {activeTab === 0 && ( <Typography variant="h6">Overview Content</Typography> )}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, flexShrink: 0 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>Add field</Typography>
                <RadioGroup row value={inputMode} onChange={handleInputModeChange}>
                  <FormControlLabel value="form" control={<Radio size="small" />} label="Form mode" />
                  <FormControlLabel value="json" control={<Radio size="small" />} label="JSON mode" />
                </RadioGroup>
              </Paper>
              {inputMode === 'form' ? (
                <Paper component="form" variant="outlined" sx={{ p: 2, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Title" name="title" value={addFieldForm.title} onChange={handleAddFieldFormChange} fullWidth size="small" placeholder="Enter title" InputLabelProps={{ shrink: true }} />
                  <TextField label="Placeholder" name="placeholder" value={addFieldForm.placeholder} onChange={handleAddFieldFormChange} fullWidth size="small" placeholder="Enter placeholder" InputLabelProps={{ shrink: true }} />
                  <TextField label="Help" name="help" value={addFieldForm.help} onChange={handleAddFieldFormChange} fullWidth size="small" multiline rows={2} placeholder="Enter help text" InputLabelProps={{ shrink: true }} />
                  <TextField label="Id *" name="id" value={addFieldForm.id} onChange={handleAddFieldFormChange} fullWidth size="small" required placeholder="Unique id" InputLabelProps={{ shrink: true }} />
                  <TextField label="Default value" name="defaultValue" value={addFieldForm.defaultValue} onChange={handleAddFieldFormChange} fullWidth size="small" placeholder="Enter default value" InputLabelProps={{ shrink: true }} />
                  <FormControlLabel control={<input type="checkbox" name="required" checked={addFieldForm.required} onChange={handleAddFieldFormChange} />} label="Is this field required?" />
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddFieldFormSubmit} sx={{ mt: 1 }}>Add Field</Button>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenInputBuilderForAdd([])} sx={{ mt: 1 }}>Advanced Field Options</Button>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flexShrink: 0 }}>Edit raw JSON for adding fields.</Typography>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden', border: '1px solid #ddd', borderRadius: 1 }}>
                    <BlockOrderPage showJsonEditorOnly={true} fields={fields} onFieldsChange={setFields} />
                  </Box>
                </Paper>
              )}
            </Box>
          )}
          {activeTab === 2 && ( <Typography variant="h6">API Configuration</Typography> )}
        </Box>
      </Box>
      <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', p: 2, overflowY: 'auto', borderRight: '1px solid #ddd' }}>
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>Input Fields Preview</Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, bgcolor: '#fff', border: '1px solid #ddd', borderRadius: 1 }}>
          <FormPreview
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onOpenInputBuilderForEdit={handleOpenInputBuilderForEdit}
            onMoveField={handleMoveField}
            onDeleteField={handleDeleteField}
            onDuplicateField={handleDuplicateField}
            sampleData={sampleData}
            onSampleDataChange={handleSampleDataChange}
          />
        </Box>
      </Box>
      <Box sx={{ flex: 0.8, flexShrink: 0, p: 2, bgcolor: '#fff', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Chatbot />
      </Box>
      <Dialog open={isInputBuilderOpen} onClose={handleCloseInputBuilder} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'edit' ? 'Edit Field' : 'Add New Field'}</DialogTitle>
        <DialogContent>
          <InputBuilder
            onSubmit={handleInputBuilderSubmit}
            onOpenAddDialog={handleOpenInputBuilderForAdd}
            contextPath={inputBuilderContextPath}
            initialData={inputBuilderInitialData}
            mode={dialogMode}
            // --- CHANGE #2: ADD THIS PROP ---
            allFields={allFieldsFlat}
          />
        </DialogContent>
        <DialogActions><Button onClick={handleCloseInputBuilder}>Cancel</Button></DialogActions>
      </Dialog>
    </Box>
  );
}