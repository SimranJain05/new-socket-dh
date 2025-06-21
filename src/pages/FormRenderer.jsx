import React, { useState, useEffect, useCallback } from 'react';

// Utility function to evaluate visibility
function isVisible(block, formValues) {
  const cond = block.visibilityCondition;
  if (!cond) return true; // agar jisme visiblity condition nhi hai key to yehi se true kr do 
  console.log("dfgdsfg",formValues);
  console.log("actual cond",cond.field) // -> device type
  console.log("dfg",formValues[cond.field]); // in general compare through formValues  
  return formValues[cond.field] === cond.value; // this cond.value is from inputData.js 
}

function renderField({
  blockId,
  blockData,
  childarr,
  childblocks,
  formValues,
  handleChange,
}) {
  const {
    type,
    title,
    placeholder,
    help,
    required,
    defaultValue,
    inputType,
    options,
    id,
  } = blockData;

  // Evaluate visibility
  //formValues is the central state object that keeps track of all 
  // the user inputs (like dropdowns, text fields, etc.) by their id. id se dekh raha hai 
  if (!isVisible(blockData, formValues)) return null;

  console.log("formvalues later",formValues)

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

  if (["input", "email", "tel", "text"].includes(type)) {
    return (
      <div key={blockId} className="mb-4">
        <label className="block font-medium mb-1">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={inputType || type}
          placeholder={placeholder}
          required={required}
          value={formValues[id] || ""}
          onChange={(e) => handleChange(id, e.target.value)}
          className="w-full border px-3 py-2 rounded shadow-sm"
        />
        {help && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    );
  }

  if (type === "dropdown") {
    let finalOptions = options || [];
    let shouldRender = true;
   console.log("inside",blockData.dependsOn)
    // Handle dependent dropdowns
    if (blockData.dependsOn) {
      const { field, optionsMap } = blockData.dependsOn;
      const selectedValue = formValues[field];
      finalOptions = selectedValue && optionsMap[selectedValue] ? optionsMap[selectedValue] : [];
    }

    if (!shouldRender) return null;

    return (
      <div key={blockId} className="mb-4">
        <label className="block font-medium mb-1">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        <select
  required={required}
  value={formValues[id] || ""}
  onChange={(e) => handleChange(id, e.target.value, blockData)}
  className="w-full border px-3 py-2 rounded shadow-sm"
>
  <option value="" disabled>
    {finalOptions.length === 0 ? "No options available" : "Select an option"}
  </option>
  {finalOptions.map((opt, idx) => (
    <option key={idx} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>
        {help && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    );
  }

  if (type === "input_group") {
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
            formValues,
            handleChange,
          })
        )}
      </fieldset>
    );
  }

  return null;
}

export default function FormRenderer({ blocks, order }) {
  const [formValues, setFormValues] = useState({});

  const handleChange = useCallback((id, value, blockData = {}) => {
    setFormValues((prev) => {     // here stores the values
      const updated = { ...prev, [id]: value };

      // Reset dependent dropdown when parent changes
      if (id === "countryName") {
        updated["stateName"] = ""; // clears the selection here
      }

      return updated;
    });
  }, []);
   // formValues is calculated inside this FormRender which runs for every field
  useEffect(() => {   // populating default Values inside Form Builder
    const defaults = {};
    for (const blockId of order) {
      const block = blocks[blockId];
      const { id, defaultValue } = block.info;
      if (id && defaultValue !== undefined) {
        defaults[id] = defaultValue;
      }
    }
    setFormValues((prev) => ({ ...defaults, ...prev }));
  }, [blocks, order]);

  return (
    <form className="w-full p-4">
      {order.map((blockId) => {
        const block = blocks[blockId];
        return renderField({
          blockId,
          blockData: block.info,
          childarr: block.childarr,
          childblocks: block.childblocks,
          formValues,
          handleChange,
        });
      })}
    </form>
  );
}
