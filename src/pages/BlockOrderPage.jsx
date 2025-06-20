import React, { useState, useCallback, useMemo } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks } from '../blockUtils.js';
import { moveItemInNestedArray } from '../moveUtils.js';
import { BlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';

// Helper to update nested array by index path (memoized outside component)
const updateByIndexPath = (arr, path, updater) => {
  if (path.length === 0) return updater(arr);
  const [head, ...rest] = path;
  return arr.map((item, idx) =>
    idx === head
      ? rest.length
        ? { ...item, children: updateByIndexPath(item.children || [], rest, updater) }
        : updater(item)
      : item
  );
};

export default function BlockOrderPage() {
  const [json, setJson] = useState(JSON.stringify(input, null, 2));
  const [inputArr, setInputArr] = useState(input);
  const [error, setError] = useState(null);

  // Memoized result to prevent recalculation
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

  // Sync JSON editor with inputArr
  React.useEffect(() => {
    setJson(JSON.stringify(inputArr, null, 2));
  }, [inputArr]);

  // Stable callback for block editing - now uses ref to avoid recreating on every render
  const onBlockEdit = useCallback((indexPath, updatedFields) => {
    setInputArr(prev =>
      updateByIndexPath(prev, indexPath, item => ({
        ...item,
        ...updatedFields
      }))
    );
  }, []);

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

// Optimized memoization with proper prop comparison
const MemoizedBlockTree = React.memo(BlockTree, (prevProps, nextProps) => {
  // Only re-render if block data or position changes
  const shouldUpdate = 
    prevProps.blockId !== nextProps.blockId ||
    prevProps.indexPath.join() !== nextProps.indexPath.join() ||
    prevProps.parentLength !== nextProps.parentLength ||
    !isEqual(prevProps.blockData, nextProps.blockData) ||
    !isEqual(prevProps.childarr, nextProps.childarr) ||
    !isEqual(prevProps.childblocks, nextProps.childblocks);

  return !shouldUpdate;
});

// Simple shallow comparison helper
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}


// 1. BlockOrderPage.jsx
// Changes:

// Improved Memoization Logic:

// Replaced shallow prop comparison with deep comparison using JSON.stringify for blockData, childarr, and childblocks.

// Added a helper function isEqual to ensure accurate deep comparisons.

// Now, MemoizedBlockTree only re-renders when props actually change.

// Stable Callbacks:

// Ensured onBlockEdit and onMove are memoized with useCallback to prevent unnecessary recreations.

// Why?
// Prevents re-renders of unrelated blocks when editing or moving a single block.