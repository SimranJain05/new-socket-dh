import React, { useState } from 'react';
import {
  TextField, Select, MenuItem, Checkbox,
  FormControl, FormControlLabel, InputLabel,
  Button, IconButton
} from '@mui/material';
import {
  ArrowUpward as Up, ArrowDownward as Down, Edit as EditIcon
} from '@mui/icons-material';

const FormPreview = ({ data, selectedPath, onSelectPath, onMove, onEdit }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const renderField = (fld, path = []) => {
    const isSelected = path.join() === selectedPath.join();
    const idx = path[path.length - 1];
    const parent = path.length > 1
      ? getNested(data, path.slice(0, -1)).children
      : data;
    const canUp = idx > 0;
    const canDn = idx < parent.length - 1;

    const startEdit = () => {
      setEditingId(fld.id);
      setEditValues({
        id: fld.id, type: fld.type, title: fld.title || '',
        helptext: fld.helptext || '', placeholder: fld.placeholder || '',
        required: fld.required || false,
        options: fld.options ? [...fld.options] : []
      });
    };

    const saveEdit = () => {
      onEdit(path, editValues);
      setEditingId(null);
    };

    const onFieldChange = e => {
      const { name, value, type, checked } = e.target;
      setEditValues(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    return (
      <div
        key={fld.id}
        className={`border p-4 mb-4 rounded ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
        onClick={() => onSelectPath(path)}
      >
        <div className="flex justify-between">
          <div>
            <IconButton size="small" onClick={() => onMove(path, 'up')} disabled={!canUp}><Up/></IconButton>
            <IconButton size="small" onClick={() => onMove(path, 'down')} disabled={!canDn}><Down/></IconButton>
          </div>
          <div>
            {editingId === fld.id ? (
              <Button size="small" onClick={saveEdit}>Save</Button>
            ) : (
              <IconButton size="small" onClick={startEdit}><EditIcon/></IconButton>
            )}
          </div>
        </div>

        {editingId === fld.id ? (
          <div className="space-y-2 mt-4">
            <TextField label="Key" name="id" value={editValues.id} disabled fullWidth size="small"/>
            <TextField label="Type" name="type" value={editValues.type} disabled fullWidth size="small"/>
            <TextField label="Title" name="title" value={editValues.title} onChange={onFieldChange} fullWidth size="small"/>
            <TextField label="Help Text" name="helptext" value={editValues.helptext} onChange={onFieldChange} fullWidth size="small"/>
            <TextField label="Placeholder" name="placeholder" value={editValues.placeholder} onChange={onFieldChange} fullWidth size="small"/>
            <FormControlLabel
              control={<Checkbox name="required" checked={editValues.required} onChange={onFieldChange}/>}
              label="Required"
            />
            {fld.type === 'dropdown' && (
              <div className="mt-2 space-y-2">
                <div className="font-bold">Options:</div>
                {editValues.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <TextField
                      label="Label"
                      value={opt.label}
                      onChange={e => updateOption(i, 'label', e.target.value)}
                      size="small"
                    />
                    <TextField
                      label="Value"
                      value={opt.value}
                      onChange={e => updateOption(i, 'value', e.target.value)}
                      size="small"
                    />
                  </div>
                ))}
                <Button size="small" onClick={() => setEditValues(prev => ({
                  ...prev,
                  options: [...prev.options, { label: '', value: '' }]
                }))}>Add Option</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <strong>{fld.title}</strong>
            {renderInput(fld)}
          </div>
        )}

        {Array.isArray(fld.children) && fld.children.length > 0 && (
          <div className="ml-4 mt-4">
            {fld.children.map((c, i) => renderField(c, [...path, i]))}
          </div>
        )}
      </div>
    );
  };

  const renderInput = fld => {
    const disabled = false; // simplify
    switch (fld.type) {
      case 'text':
      case 'input':
        return <TextField placeholder={fld.placeholder} disabled={disabled} fullWidth size="small"/>;
      case 'dropdown':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{fld.placeholder || fld.title}</InputLabel>
            <Select value="" disabled={disabled}>
              {fld.options?.map((opt, i) => (
                <MenuItem key={i} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'checkbox':
        return <FormControlLabel control={<Checkbox disabled={disabled}/>} label={fld.title}/>;
      default:
        return <div>Unsupported type: {fld.type}</div>;
    }
  };

  const getNested = (arr, path) => path.reduce((acc, i) => acc.children[i], { children: arr });

  const updateOption = (i, key, val) => {
    setEditValues(prev => {
      const options = [...prev.options];
      options[i] = { ...options[i], [key]: val };
      return { ...prev, options };
    });
  };

  return <div>{data.map((f, i) => renderField(f, [i]))}</div>;
};

export default FormPreview;
