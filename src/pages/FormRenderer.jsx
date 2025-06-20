import React from 'react';

function renderField({ blockId, blockData, childarr, childblocks }) {
  const {
    type,
    title,
    placeholder,
    help,
    required,
    defaultValue,
    inputType,
    options
  } = blockData;

  // For dynamic JS function placeholders
  if (typeof childarr === 'string' && childarr.includes('function')) {
    return (
      <div
        key={blockId}
        className="p-3 border border-yellow-400 bg-yellow-100 text-sm rounded mb-4"
      >
        ⚠️ Placeholder for dynamic fields: <code>{childarr}</code>
      </div>
    );
  }

  // Input fields
  if (['input', 'email', 'tel', 'text'].includes(type)) {
    return (
      <div key={blockId} className="mb-4">
        <label className="block font-medium mb-1">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={inputType || type}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className="w-full border px-3 py-2 rounded shadow-sm"
        />
        {help && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    );
  }

  // Dropdown field
  if (type === 'dropdown') {
    return (
      <div key={blockId} className="mb-4">
        <label className="block font-medium mb-1">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          defaultValue={defaultValue}
          required={required}
          className="w-full border px-3 py-2 rounded shadow-sm"
        >
          {options?.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {help && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    );
  }

  // Input group with children
  if (type === 'input_group') {
    return (
      <fieldset
        key={blockId}
        className="mb-6 border border-gray-300 p-4 rounded-lg"
      >
        <legend className="text-base font-semibold">{title}</legend>
        {help && <p className="text-sm text-gray-500 mb-2">{help}</p>}
        {childarr.map((childId) =>
          renderField({
            blockId: childId,
            blockData: childblocks[childId].info,
            childarr: childblocks[childId].childarr,
            childblocks: childblocks[childId].childblocks,
          })
        )}
      </fieldset>
    );
  }

  return null;
}

export default function FormRenderer({ blocks, order }) {
  return (
    <form className="w-full p-4">
      {order.map((blockId) => {
        const block = blocks[blockId];
        return renderField({
          blockId,
          blockData: block.info,
          childarr: block.childarr,
          childblocks: block.childblocks,
        });
      })}
    </form>
  );
}
