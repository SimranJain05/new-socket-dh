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

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%',width:'200', display: 'flex', flexDirection: 'column' }}
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
  const [fields, setFields] = useState([
    { id: 'email', type: 'TextField', label: 'Send Email to', required: true },
    { id: 'connection', type: 'Select', label: 'Select Connection', options: [] }
  ]);
  const [jsonData, setJsonData] = useState({ fields: [] });
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  // State for the InputBuilder dialog
  const [isInputBuilderOpen, setIsInputBuilderOpen] = useState(false);
  const [inputBuilderParentPath, setInputBuilderParentPath] = useState([]);
  const [inputBuilderInitialData, setInputBuilderInitialData] = useState(null);

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

          // Update JSON data to reflect the changes
          setJsonData(prev => ({
            ...prev,
            fields: newFields
          }));

          return newFields;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId]);

  // Sync JSON data with fields
  useEffect(() => {
    setJsonData(prev => ({ ...prev, fields }));
  }, [fields]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputModeChange = (event) => {
    setInputMode(event.target.value);
  };

  const handleOpenInputBuilderForAdd = useCallback((parentPath = []) => {
    setInputBuilderInitialData(null);
    setInputBuilderParentPath(parentPath);
    setIsInputBuilderOpen(true);
  }, []);

  const handleOpenInputBuilderForEdit = useCallback((indexPath, fieldData) => {
    setInputBuilderInitialData(fieldData);
    setInputBuilderParentPath(indexPath.slice(0, -1));
    setIsInputBuilderOpen(true);
  }, []);

  const handleCloseInputBuilder = useCallback(() => {
    setIsInputBuilderOpen(false);
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
      label: addFieldForm.title,
      required: addFieldForm.required,
      placeholder: addFieldForm.placeholder,
      defaultValue: addFieldForm.defaultValue
    };

    setFields(prev => [...prev, newField]);
    setAddFieldForm({
      title: '', placeholder: '', help: '', id: '', defaultValue: '', required: false, type: 'TextField'
    });
  };

  const handleFieldReorder = (updatedFields) => {
    setFields(updatedFields);
    setJsonData(prev => ({
      ...prev,
      fields: updatedFields
    }));
  };

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
            <Box sx={{p:2}}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                Show dropdown for selecting options instead or blowing all options on occasion
              </Typography>
            </Box>
          </TabPanel>

          {/* START OF MODIFIED SECTION FOR JSON EDITOR HEIGHT */}
          {/* This Box is the main content area for the tab, it needs to be a flex column */}
          <TabPanel value={activeTab} index={1} sx={{ p: 0 }}> {/* p:0 here allows its child Box to manage padding */}
            {/* Inner Box to manage padding and flex layout for content */}
            <Box sx={{ flex: 1, width:'150%',display: 'flex', flexDirection: 'column', p: 2, overflowY: 'auto' }}>

              {/* Common Header for Add Field and Radio buttons - Always visible */}
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
                      onClick={() => handleOpenInputBuilderForAdd([])}
                      sx={{ mt: 1 }}
                    >
                      Advanced Field Options
                    </Button>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" sx={{ mt: 2, mb: 1, display: 'block' }}>Field Types (Click to Add / Expand)</Typography>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Button variant="outlined" sx={{justifyContent: 'flex-start'}} disableRipple endIcon={<ExpandMoreIcon />}>Date picker</Button>
                      <Button variant="outlined" sx={{justifyContent: 'flex-start'}} disableRipple endIcon={<ExpandMoreIcon />}>Checkbox</Button>
                      <Button variant="outlined" sx={{justifyContent: 'flex-start'}} disableRipple endIcon={<ExpandMoreIcon />}>Radio Group</Button>
                      <Button variant="outlined" sx={{justifyContent: 'flex-start'}} disableRipple endIcon={<ExpandMoreIcon />}>Input Group</Button>
                      <Button variant="outlined" sx={{justifyContent: 'flex-start'}} disableRipple endIcon={<ExpandMoreIcon />}>Attachment</Button>
                      <Button variant="outlined" sx={{justifyContent: 'flex-start'}} disableRipple endIcon={<ExpandMoreIcon />}>TextArea</Button>
                      <Button variant="outlined" sx={{justifyContent: 'flex-start'}} disableRipple endIcon={<ExpandMoreIcon />}>Dropdown</Button>
                    </div>
                  </Box>
                </Paper>
              )}

               {/* START OF MODIFIED JSON MODE BLOCK */}
                  {inputMode === 'json' && (
                    <Paper
                      variant="outlined"
                      sx={{
                        // KEY CHANGES:
                        flexGrow: 1, // 1. Allow this Paper to grow and fill available vertical space.
                        display: 'flex', // 2. Use flexbox for its direct children.
                        flexDirection: 'column', // 3. Arrange children vertically.
                        overflow: 'hidden', // 4. Prevent this Paper itself from scrolling.
                        p: 2, // Keep your original padding
                      }}
                    >
                      {/* Child 1: The header text (will not grow) */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flexShrink: 0 }}>
                        Edit raw JSON for adding fields.
                      </Typography>

                      {/* Child 2: A wrapper Box for the editor (this is what will grow) */}
                      <Box sx={{
                        flexGrow: 1, // This Box takes all the space between the text and the button.
                        overflow: 'hidden', // Hide overflow
                        border: '1px solid #ddd', // Optional: adds a border around the editor area
                        borderRadius: 1
                      }}>
                        <BlockOrderPage
                          showJsonEditorOnly={true}
                          jsonData={jsonData}
                          onJsonChange={setJsonData}
                        />
                      </Box>

                      {/* Child 3: The footer button (will not grow) */}
                      <Button
                        variant="contained"
                        sx={{ mt: 2, flexShrink: 0 }}
                        onClick={() => {
                          try {
                            if (jsonData.fields) {
                              setFields(jsonData.fields);
                            }
                          } catch (err) {
                            console.error('Error updating fields from JSON', err);
                          }
                        }}
                      >
                        Update Fields from JSON
                      </Button>
                    </Paper>
                  )}
                  {/* END OF MODIFIED JSON MODE BLOCK */}
                  </Box>
          </TabPanel>
          {/* END OF MODIFIED SECTION */}

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
            jsonData={jsonData}
            onJsonChange={setJsonData}
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
        <DialogTitle>{inputBuilderInitialData ? 'Edit Field' : 'Add New Field'}</DialogTitle>
        <DialogContent>
          <InputBuilder
            onAddField={(path, field) => {
              const newField = {
                id: field.id,
                type: field.type,
                label: field.label,
                required: field.required,
                placeholder: field.placeholder,
                defaultValue: field.defaultValue,
                options: field.options
              };

              setFields(prev => [...prev, newField]);
              handleCloseInputBuilder();
            }}
            parentPath={inputBuilderParentPath}
            initialData={inputBuilderInitialData}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInputBuilder}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}