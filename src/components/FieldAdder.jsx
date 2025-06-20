import React from 'react';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const fieldTypes = [
  { type: 'text', label: 'Text Input' },
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'dynamic-dropdown', label: 'Dynamic Dropdown' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'radio', label: 'Radio Group' },
  { type: 'group', label: 'Field Group' }
];

const FieldAdder = ({ onAddField, selectedPath }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddField = (type) => {
    onAddField(type, selectedPath);
    handleClose();
  };

  return (
    <div className="mt-4">
      <Typography variant="subtitle2" gutterBottom>
        Add New Field
      </Typography>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleClick}
        fullWidth
      >
        Add Field
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {fieldTypes.map((field) => (
          <MenuItem key={field.type} onClick={() => handleAddField(field.type)}>
            {field.label}
          </MenuItem>
        ))}
      </Menu>
      {selectedPath && selectedPath.length > 0 && (
        <Typography variant="caption" className="mt-2 block">
          Field will be added inside selected group
        </Typography>
      )}
    </div>
  );
};

export default FieldAdder;