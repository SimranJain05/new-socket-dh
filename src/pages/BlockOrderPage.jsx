import React, { useState, useCallback, useMemo } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks, moveItemInNestedArray, updateByIndexPath } from '../utils.js';
import { MemoizedBlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';

export default function BlockOrderPage() {
  const [json, setJson] = useState(JSON.stringify(input, null, 2));
  const [inputArr, setInputArr] = useState(input);
  const [error, setError] = useState(null);

  // Memoized result to prevent recalculation
  // Purpose: Converts input array to order + blocks structure
  // Returns: { order: [blockIds], blocks: { [blockId]: { info, childarr, childblocks } } }
  const result = useMemo(() => convertToOrderBlocks(inputArr), [inputArr]);

  // Stable callback for JSON changes
  const handleJsonChange = useCallback((val) => {
    setJson(val);
  }, []);

  // Stable callback for JSON validation
  const handleJsonBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(json);
      setInputArr(parsed);
      setError(null);
    } catch (e) {
      setError('Invalid JSON');
    }
  }, [json]);


  // Sync the navigation movements up/down from GUI with the input array
  React.useEffect(() => {
    setJson(JSON.stringify(inputArr, null, 2));
  }, [inputArr]);
   
  //Purpose: Handles editing/updating of block properties (title, placeholder, help text, etc.)
  // indexPath: Array of indices leading to the block to edit
  // updatedFields: Object containing fields to update recieved from BlockTree.js
  // Stable callback for block editing - now uses ref to avoid recreating on every render
  const onBlockEdit = useCallback((indexPath, updatedFields) => {
    setInputArr(prev =>
      updateByIndexPath(prev, indexPath, item => ({
        ...item,
        ...updatedFields
      }))
    );
  }, []);


  // Purpose: Handles reordering blocks (moving them up/down in the hierarchy)
  // Stable callback for moving blocks - now uses ref to avoid recreating on every render
  const onMove = useCallback((indexPath, direction) => {
    setInputArr(prev => moveItemInNestedArray(prev, indexPath, direction));
  }, []);

  return (
    <div className="flex w-full gap-4 p-4">
      <div className="w-1/2 mr-4">
        <h2 className="text-lg font-semibold mb-2">Editable inputData</h2>
        <div className="h-full">
          <JsonEditor 
            value={json} 
            onChange={handleJsonChange} 
            onBlur={handleJsonBlur} 
          />
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
      <div className="w-1/2">
        <h2 className="text-lg font-semibold mb-2">Rendered Block Tree</h2>
        <div className="h-full">
          {result.order.map((blockId, i) => {
            const block = result.blocks[blockId];
            return (
              <MemoizedBlockTree
                key={blockId}
                blockId={blockId}
                blockData={block.info}
                childarr={block.childarr}
                childblocks={block.childblocks}
                indexPath={[i]}
                onBlockEdit={onBlockEdit}
                onMove={onMove}
                parentLength={inputArr.length}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
