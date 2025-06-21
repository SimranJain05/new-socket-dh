import React, { useState, useEffect, useCallback } from 'react';
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
import { updateByIndexPath } from '../utils.js';
import { input } from '../inputData.js'; // Import the initial input data

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%', width: '200', display: 'flex', flexDirection: 'column' }}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function ActionConfigPage() {
  const [activeTab, setActiveTab] = useState(1);
  const [inputMode, setInputMode] = useState('form');
  const [fields, setFields] = useState(input); // Initialize with inputData
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  // State for the InputBuilder dialog
  const [isInputBuilderOpen, setIsInputBuilderOpen] = useState(false);
  // This path will be the exact indexPath for EDITING, or parentPath for ADDING
  const [inputBuilderContextPath, setInputBuilderContextPath] = useState([]);
  const [inputBuilderInitialData, setInputBuilderInitialData] = useState(null);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'

  // Keyboard navigation for moving fields
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFieldId) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? 'up' : 'down';

        setFields(prevFields => {
          const index = prevFields.findIndex(f => f.id === selectedFieldId);
          if (index === -1) return prevFields;

          const newFields = [...prevFields];
          if (direction === 'up' && index > 0) {
            [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
          } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
          }
          return newFields;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputModeChange = (event) => {
    setInputMode(event.target.value);
  };

  // Opens InputBuilder for ADDING a NEW field (from left panel or as sub-field)
  const handleOpenInputBuilderForAdd = useCallback((parentPath = []) => {
    setInputBuilderInitialData(null); // No initial data for adding
    setInputBuilderContextPath(parentPath); // Path to the parent where new field will be added
    setDialogMode('add');
    setIsInputBuilderOpen(true);
  }, []);

  // Opens InputBuilder for EDITING an EXISTING field (from middle panel pencil icon)
  const handleOpenInputBuilderForEdit = useCallback((indexPath, fieldData) => {
    setInputBuilderInitialData(fieldData); // Pass existing field data
    setInputBuilderContextPath(indexPath); // This is the exact path to the item being edited
    setDialogMode('edit');
    setIsInputBuilderOpen(true);
  }, []);

  const handleCloseInputBuilder = useCallback(() => {
    setIsInputBuilderOpen(false);
    setInputBuilderInitialData(null); // Clear initial data on close
    setInputBuilderContextPath([]); // Clear path on close
    setDialogMode('add'); // Reset dialog mode to default
  }, []);

  const [addFieldForm, setAddFieldForm] = useState({
    title: '', placeholder: '', help: '', id: '', defaultValue: '', required: false, type: 'TextField'
  });

  const handleAddFieldFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddFieldForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddFieldFormSubmit = () => {
    const newField = {
      id: addFieldForm.id,
      type: addFieldForm.type,
      label: addFieldForm.title, // 'label' for form components
      title: addFieldForm.title, // 'title' for display in BlockTree
      required: addFieldForm.required,
      placeholder: addFieldForm.placeholder,
      defaultValue: addFieldForm.defaultValue,
      children: []
    };
    // Directly add to root for the simple form
    setFields(prev => [...prev, newField]);
    setAddFieldForm({
      title: '', placeholder: '', help: '', id: '', defaultValue: '', required: false, type: 'TextField'
    });
  };

  // This handler is now used by InputBuilder (when submitting its internal form)
  // It receives the current contextPath (either edit path or parent add path)
  const handleInputBuilderSubmit = useCallback((submittedPath, fieldData, mode) => {
    const processedField = {
        id: fieldData.id,
        type: fieldData.type,
        title: fieldData.title, // Use title for display
        label: fieldData.label, // Use label for form components
        help: fieldData.help,
        required: fieldData.required,
        placeholder: fieldData.placeholder,
        defaultValue: fieldData.defaultValue,
        options: fieldData.options,
        dynamicOptions: fieldData.dynamicOptions,
        dynamicChildren: fieldData.dynamicChildren,
        children: fieldData.children || [], // Ensure children is always an array
    };

    setFields(prevFields => {
        if (mode === 'edit') {
            // 'submittedPath' is the indexPath of the item being edited
            return updateByIndexPath(prevFields, submittedPath, () => processedField);
        } else if (mode === 'add' || mode === 'add-child') {
            // 'submittedPath' is the parentPath where the new field should be added
            if (submittedPath.length === 0) {
                // Adding to root
                return [...prevFields, processedField];
            } else {
                // Adding as a child
                return updateByIndexPath(prevFields, submittedPath, (parent) => {
                    const currentChildren = Array.isArray(parent.children) ? parent.children : [];
                    return {
                        ...parent,
                        children: [...currentChildren, processedField],
                    };
                });
            }
        }
        return prevFields; // Should not happen
    });
    handleCloseInputBuilder();
}, [handleCloseInputBuilder]);


  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', bgcolor: '#f5f5f5' }}>
      {/* Column 1: Action Name / Tabs and Add Field Section */}
      <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #ddd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <Typography variant="h5" sx={{ flexGrow: 1, ml: 2 }}>
              Action Name
            </Typography>
            <Button variant="contained" color="primary" sx={{ mr: 1 }}>Save</Button>
            <Button variant="outlined" color="primary">Publish</Button>
          </Box>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="action configuration tabs">
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Input Configuration" {...a11yProps(1)} />
            <Tab label="API" {...a11yProps(2)} />
          </Tabs>
        </AppBar>

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6">Overview Content</Typography>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                Show dropdown for selecting options instead or blowing all options on occasion
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1} sx={{ p: 0 }}>
            <Box sx={{ flex: 1, width: '150%', display: 'flex', flexDirection: 'column', p: 2, overflowY: 'auto' }}>

              <Paper variant="outlined" sx={{ p: 2, mb: 2, flexShrink: 0 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>Add field</Typography>
                <RadioGroup row value={inputMode} onChange={handleInputModeChange} sx={{ mb: 2 }}>
                  <FormControlLabel value="form" control={<Radio size="small" />} label="Form mode" />
                  <FormControlLabel value="json" control={<Radio size="small" />} label="JSON mode" />
                </RadioGroup>
              </Paper>

              {inputMode === 'form' && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, flexShrink: 0, overflowY: 'auto' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                    <TextField
                      label="Title"
                      name="title"
                      value={addFieldForm.title}
                      onChange={handleAddFieldFormChange}
                      fullWidth
                      size="small"
                      placeholder="Enter title for the field"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Placeholder"
                      name="placeholder"
                      value={addFieldForm.placeholder}
                      onChange={handleAddFieldFormChange}
                      fullWidth
                      size="small"
                      placeholder="Enter placeHolder for the field"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Help"
                      name="help"
                      value={addFieldForm.help}
                      onChange={handleAddFieldFormChange}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Enter help text for the field"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Id *"
                      name="id"
                      value={addFieldForm.id}
                      onChange={handleAddFieldFormChange}
                      fullWidth
                      size="small"
                      required
                      placeholder="Give unique id for the field"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Default value"
                      name="defaultValue"
                      value={addFieldForm.defaultValue}
                      onChange={handleAddFieldFormChange}
                      fullWidth
                      size="small"
                      placeholder="Enter default value for the field"
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormControlLabel
                      control={
                        <input
                          type="checkbox"
                          name="required"
                          checked={addFieldForm.required}
                          onChange={handleAddFieldFormChange}
                          style={{ marginRight: '8px' }}
                        />
                      }
                      label="Is this field required?"
                      sx={{ ml: 0 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleAddFieldFormSubmit}
                      sx={{ mt: 1 }}
                    >
                      Add Field
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenInputBuilderForAdd([])} // Open for root-level add
                      sx={{ mt: 1 }}
                    >
                      Advanced Field Options
                    </Button>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" sx={{ mt: 2, mb: 1, display: 'block' }}>Field Types (Click to Add / Expand)</Typography>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} disableRipple endIcon={<ExpandMoreIcon />}>Date picker</Button>
                      <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} disableRipple endIcon={<ExpandMoreIcon />}>Checkbox</Button>
                      <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} disableRipple endIcon={<ExpandMoreIcon />}>Radio Group</Button>
                      <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} disableRipple endIcon={<ExpandMoreIcon />}>Input Group</Button>
                      <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} disableRipple endIcon={<ExpandMoreIcon />}>Attachment</Button>
                      <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} disableRipple endIcon={<ExpandMoreIcon />}>TextArea</Button>
                      <Button variant="outlined" sx={{ justifyContent: 'flex-start' }} disableRipple endIcon={<ExpandMoreIcon />}>Dropdown</Button>
                    </div>
                  </Box>
                </Paper>
              )}

              {inputMode === 'json' && (
                <Paper
                  variant="outlined"
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    p: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flexShrink: 0 }}>
                    Edit raw JSON for adding fields.
                  </Typography>

                  <Box sx={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}>
                    <BlockOrderPage
                      showJsonEditorOnly={true}
                      fields={fields}
                      onFieldsChange={setFields}
                    />
                  </Box>
                </Paper>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ height: '100%', width: '100%', p: 2 }}>
              <Typography variant="h6">API Configuration</Typography>
              <Typography variant="body2" color="text.secondary">
                This section can be used for API settings, authentication, etc.
                The JSON editor has been moved to "Input Configuration > JSON mode".
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Box>

      {/* Column 2: Input Field Preview */}
      <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', p: 2, overflowY: 'auto', borderRight: '1px solid #ddd' }}>
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>Input Fields Preview</Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, bgcolor: '#fff', border: '1px solid #ddd', borderRadius: 1 }}>
          <BlockOrderPage
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onFieldsChange={setFields}
            onOpenInputBuilderForEdit={handleOpenInputBuilderForEdit} // Pass the handler for full editing
          />
        </Box>
      </Box>

      {/* Column 3: Right Sidebar for AI Assistant */}
      <Box sx={{ flex: 0.8, flexShrink: 0, p: 2, bgcolor: '#fff', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, mt: 2 }}>Action Builder Assistant</Typography>
        <img
          src="https://img.icons8.com/color/96/000000/ai.png"
          alt="AI Assistant"
          style={{
            borderRadius: '50%',
            marginBottom: '16px',
            width: '80px',
            height: '80px',
            objectFit: 'cover'
          }}
        />
        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
          What can I help with?
        </Typography>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button variant="outlined" size="small" fullWidth sx={{ justifyContent: 'flex-start' }}>
            Suggest field types
          </Button>
          <Button variant="outlined" size="small" fullWidth sx={{ justifyContent: 'flex-start' }}>
            Optimize form layout
          </Button>
          <Button variant="outlined" size="small" fullWidth sx={{ justifyContent: 'flex-start' }}>
            Validate JSON schema
          </Button>
        </Box>
        <Paper variant="outlined" sx={{ width: '100%', p: 1, mt: 2, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Message AI Assistant..."
            variant="standard"
            InputProps={{
              disableUnderline: true,
              endAdornment: <span style={{ marginLeft: 'auto', cursor: 'pointer' }}>&#9650;</span>
            }}
          />
        </Paper>
      </Box>

      {/* InputBuilder Dialog */}
      <Dialog open={isInputBuilderOpen} onClose={handleCloseInputBuilder} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'edit' ? 'Edit Field' : 'Add New Field'}</DialogTitle>
        <DialogContent>
          <InputBuilder
            onSubmit={handleInputBuilderSubmit} // Unified submit handler
            onOpenAddDialog={handleOpenInputBuilderForAdd} // Prop for InputBuilder to request a new ADD dialog
            contextPath={inputBuilderContextPath} // Path for current operation (edit path or add parent path)
            initialData={inputBuilderInitialData}
            mode={dialogMode} // Pass the mode to InputBuilder ('add' or 'edit')
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInputBuilder}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}