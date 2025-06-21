import React from 'react';
import TextField from '@mui/material/TextField';

export default function JsonInputField({ value, onChange, onBlur, error }) {
  return (
    <div>
      <TextField
        label="JSON Input"
        multiline
        minRows={10}
        maxRows={35}
        fullWidth
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        error={!!error}
        helperText={error}
        variant="outlined"
        sx={{ fontFamily: 'monospace', fontSize: 14 }}
      />
    </div>
  );
}
