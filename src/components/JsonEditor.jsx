import React from 'react';

export default function JsonEditor({ value, onChange, onBlur, onFocus }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      style={{
        width: '100%',
        height: '100%',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: '12px',
        boxSizing: 'border-box',
        border: 'none',
        outline: 'none',
      }}
    />
  );
}
