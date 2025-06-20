import React, { useState, useCallback, useMemo } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks, moveItemInNestedArray, updateByIndexPath } from '../utils.js';
import { MemoizedBlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';
import InputBuilder from '../components/InputBuilder'; // Ensure InputBuilder is imported

export default function BlockOrderPage({ showJsonEditorOnly = false }) { // Removed onAddField prop from here, it's handled internally now
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

  // New function to add a field, wrapping the existing updateByIndexPath
  const onAddField = useCallback((parentPath, newField) => {
    setInputArr(prev => {
      if (parentPath.length === 0) {
        // Add to the root level
        return [...prev, newField];
      } else {
        // Add as a child to an existing item at parentPath
        return updateByIndexPath(prev, parentPath, (item) => {
          // Ensure 'children' is an array before pushing
          const currentChildren = Array.isArray(item.children) ? item.children : [];
          return {
            ...item,
            children: [...currentChildren, newField],
          };
        });
      }
    });
  }, []);

  // Purpose: Handles deleting blocks
  const onBlockDelete = useCallback((indexPath) => {
    setInputArr(prev => {
        if (indexPath.length === 1) {
            // Deleting a root-level item
            const newArr = [...prev];
            newArr.splice(indexPath[0], 1);
            return newArr;
        }
        // Deleting a nested item
        return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => {
            const indexToDelete = indexPath[indexPath.length - 1];
            const newChildren = [...parent.children];
            newChildren.splice(indexToDelete, 1);
            return { ...parent, children: newChildren };
        });
    });
  }, []);

  // Purpose: Handles duplicating blocks
  const onBlockDuplicate = useCallback((indexPath) => {
    setInputArr(prev => {
        if (indexPath.length === 1) {
            // Duplicating a root-level item
            const itemToDuplicate = prev[indexPath[0]];
            const duplicatedItem = { ...itemToDuplicate, id: `${itemToDuplicate.id}-copy-${Date.now()}` }; // Generate unique ID
            const newArr = [...prev];
            newArr.splice(indexPath[0] + 1, 0, duplicatedItem);
            return newArr;
        }
        // Duplicating a nested item
        return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => {
            const indexToDuplicate = indexPath[indexPath.length - 1];
            const itemToDuplicate = parent.children[indexToDuplicate];
            const duplicatedItem = { ...itemToDuplicate, id: `${itemToDuplicate.id}-copy-${Date.now()}` }; // Generate unique ID
            const newChildren = [...parent.children];
            newChildren.splice(indexToDuplicate + 1, 0, duplicatedItem);
            return { ...parent, children: newChildren };
        });
    });
  }, []);


  return (
    <>
      {showJsonEditorOnly ? (
        <div className="w-full h-full">
          <JsonEditor
            value={json}
            onChange={handleJsonChange}
            onBlur={handleJsonBlur}
          />
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      ) : (
        <div className="w-full h-full">
          {/* InputBuilder for adding root-level fields */}
          <div style={{marginBottom: '16px'}}> {/* Added margin for spacing */}
            <InputBuilder onAddField={onAddField} parentPath={[]} />
          </div>

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
                onBlockDelete={onBlockDelete} // Pass delete handler
                onBlockDuplicate={onBlockDuplicate} // Pass duplicate handler
                onAddField={onAddField} // Pass add field handler for nested additions
                parentLength={inputArr.length}
              />
            );
          })}
        </div>
      )}
    </>
  );
}