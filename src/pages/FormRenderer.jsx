import React, { useState, useEffect, useCallback } from 'react';

function isVisible(block, formValues) {
  const cond = block.visibilityCondition;
  if (!cond) return true;
  return formValues[cond.field] === cond.value;
}

function renderField({
  blockId,
  blockData,
  childarr,
  childblocks,
  formValues,
  handleChange,
  dynamicOptions = {}
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
    id
  } = blockData;

  if (!isVisible(blockData, formValues)) return null;

  if (typeof childarr === 'string' && childarr.includes('function')) {
    return (
      <div key={blockId} className="p-3 border border-yellow-400 bg-yellow-100 text-sm rounded mb-4">
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
          onChange={(e) => handleChange(id, e.target.value, blockData)}
          className="w-full border px-3 py-2 rounded shadow-sm"
        />
        {help && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    );
  }

  if (type === "dropdown") {
    let finalOptions = options || [];

    // Dynamic options (like countries)
    if (dynamicOptions[id]) {
      finalOptions = dynamicOptions[id];
    }

    // Dependent dropdown (like stateName)
    if (blockData.dependsOn) {
      const { field } = blockData.dependsOn;
      const selectedParent = formValues[field];
      if (dynamicOptions[field + "_map"]) {
        finalOptions = dynamicOptions[field + "_map"][selectedParent] || [];
      }
    }

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
            {finalOptions.length === 0 ? "Loading..." : "Select an option"}
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
      <fieldset key={blockId} className="mb-6 border border-gray-300 p-4 rounded-lg">
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
            dynamicOptions
          })
        )}
      </fieldset>
    );
  }

  return null;
}

export default function FormRenderer({ blocks, order }) {
  const [formValues, setFormValues] = useState({});
  const [dynamicOptions, setDynamicOptions] = useState({
    countryName: [],
    countryName_map: {}
  });

  const handleChange = useCallback((id, value, blockData = {}) => {
    setFormValues((prev) => {
      const updated = { ...prev, [id]: value };

      // Reset dependent dropdown when parent changes
      if (id === "countryName") {
        updated["stateName"] = "";
      }

      return updated;
    });
  }, []);

  useEffect(() => {
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

  // Fetch countries
  // useEffect(() => {
  //   async function fetchCountries() {
  //     try {
  //       const res = await fetch("https://dev.sokt.io/func/scriyEy5umbX");
  //       const data = await res.json();
  //       console.log("Country Data",data);
  //       setDynamicOptions(prev => ({ ...prev, countryName: data }));
  //     } catch (err) {
  //       console.error("Error fetching countries:", err);
  //     }
  //   }
  //   fetchCountries();
  // }, []);

  // // Fetch states
  // useEffect(() => {
  //   async function fetchStates() {
  //     try {
  //       const res = await fetch("https://dev.sokt.io/func/scrijohNaP2O");
  //       const data2 = await res.json();
  //       console.log("state Data",data2)
  //       setDynamicOptions(prev => ({ ...prev, countryName_map: data2 }));
  //     } catch (err) {
  //       console.error("Error fetching states:", err);
  //     }
  //   }
  //   fetchStates();
  // }, []);



  useEffect(() => {
    async function fetchData() {
      try {
        const [countryRes, stateRes] = await Promise.all([
          fetch("https://dev.sokt.io/func/scriyEy5umbX"),
          fetch("https://dev.sokt.io/func/scrijohNaP2O")
        ]);
  
        const countryData = await countryRes.json();
        const stateData = await stateRes.json();
  
        console.log("Country Data", countryData);
        console.log("State Data", stateData);
  
        setDynamicOptions(prev => ({
          ...prev,
          countryName: countryData,
          countryName_map: stateData
        }));
      } catch (err) {
        console.error("Error fetching dynamic data:", err);
      }
    }
  
    fetchData();
  }, []);

  

  
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
          dynamicOptions
        });
      })}
    </form>
  );
}
