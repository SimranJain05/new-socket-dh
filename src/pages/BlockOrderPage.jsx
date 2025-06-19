import React, { useState } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks } from '../blockUtils.js';
import { moveItemInNestedArray } from '../moveUtils.js';
import { BlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';

// Helper to update nested array by index path
//path for example [2,0,1]
function updateByIndexPath(arr, path, updater) {
  // console.log("path: ", path , " arr: ", arr)
  if (path.length === 0) return updater(arr);
  const [head, ...rest] = path;
  return arr.map((item, idx) =>
    idx === head
      ? rest.length
        ? { ...item, children: updateByIndexPath(item.children || [], rest, updater) }
        : updater(item)
      : item
  );
}

export default function BlockOrderPage() {
  const [json, setJson] = useState(JSON.stringify(input, null, 2));
  const [inputArr, setInputArr] = useState(input);
  const [error, setError] = useState(null);

  // Update inputArr when json changes
  const handleJsonChange = (val) => {
    setJson(val);
  };

  const handleJsonBlur = () => {
    try {
      const parsed = JSON.parse(json);
      setInputArr(parsed);
      setError(null);
    } catch (e) {
      setError('Invalid JSON');
    }
  };
  
  // Purpose: Converts input array to order + blocks structure
  // Returns: { order: [blockIds], blocks: { [blockId]: { info, childarr, childblocks } } }
  const result = React.useMemo(() => {
    const res = convertToOrderBlocks(inputArr);
    return res;
  }, [inputArr]);

  // Sync the navigation movements up/down from GUI with the input arr
  React.useEffect(() => {
    setJson(JSON.stringify(inputArr, null, 2));
  }, [inputArr]);

  console.log("result: ", result)


  // Purpose: Handles editing/updating of block properties (title, placeholder, help text, etc.)
  // indexPath: Array of indices leading to the block to edit
  // updatedFields: Object containing fields to update recieved from BlockTree.js
  const onBlockEdit = (indexPath, updatedFields) => {
    setInputArr(prev =>
      updateByIndexPath(prev, indexPath, item => ({
        ...item, // Keep existing properties
      ...updatedFields   // Override with updated ones
      }))
    );
  };


  // Purpose: Handles reordering blocks (moving them up/down in the hierarchy)
  const onMove = (indexPath, direction) => {
    console.log("indexPath: ", indexPath)
    setInputArr(prev => moveItemInNestedArray(prev, indexPath, direction));
  };

  return (
    <div className="flex w-full gap-4 p-4">
      <div className="w-1/2 mr-4">
        <h2 className="text-lg font-semibold mb-2">Editable inputData</h2>
        <div className="h-full">
          <JsonEditor value={json} onChange={handleJsonChange} onBlur={handleJsonBlur} />
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
      <div className="w-1/2">
        <h2 className="text-lg font-semibold mb-2">Rendered Block Tree</h2>
        <div className="h-full">
          {result.order.map((blockId, i) => (
            <BlockTree
              key={blockId}
              blockId={blockId}
              blocks={result.blocks}
              indexPath={[i]}
              onBlockEdit={onBlockEdit}
              onMove={onMove}
              parentLength={inputArr.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

