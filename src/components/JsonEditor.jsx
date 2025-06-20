import React from 'react';

export default function JsonEditor({ value, onChange, onBlur }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={{
        width: '100%',
        height: '100%',
        // REMOVE the next two lines. The height should be 100% of its
        // container, and manual resizing will conflict with this.
        // minHeight: '500px',
        // resize: 'vertical',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: '12px',
        boxSizing: 'border-box',
        border: 'none', // Optional: for a cleaner look within the Paper
        outline: 'none', // Optional: remove focus ring
      }}
    />
  );
}