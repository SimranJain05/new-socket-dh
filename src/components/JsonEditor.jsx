import React from 'react';

export default function JsonEditor({ value, onChange, onBlur }) {
  return (
    <textarea
      className="w-full h-full font-mono text-sm bg-gray-900 text-gray-100 p-3 rounded resize-none border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      spellCheck={false}
      style={{ minHeight: 300 }}
    />
  );
}
