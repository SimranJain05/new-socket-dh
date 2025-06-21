import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks, moveItemInNestedArray, updateByIndexPath } from '../utils.js';
import { MemoizedBlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';
import isEqual from 'lodash.isequal';
// import { Button } from '@mui/material'; // No longer needed as the direct button is removed

// Accept fields and onFieldsChange from parent, and also onOpenInputBuilderForEdit
export default function BlockOrderPage({
  showJsonEditorOnly = false,
  fields,
  onFieldsChange,
  onOpenInputBuilderForEdit,
}) {
  const currentFields = fields || input;

  const [json, setJson] = useState(() => JSON.stringify(currentFields, null, 2));
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const newJson = JSON.stringify(currentFields, null, 2);
      if (newJson !== json) {
        setJson(newJson);
        setError(null);
      }
    } catch (e) {
      console.error("Error stringifying fields to JSON:", e);
      setError("Error converting fields to JSON for display.");
    }
  }, [currentFields]);

  const result = useMemo(() => convertToOrderBlocks(currentFields), [currentFields]);

  const handleJsonChange = useCallback((val) => {
    setJson(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && !isEqual(parsed, currentFields)) {
        onFieldsChange(parsed);
        setError(null);
      }
    } catch (e) {
      setError('Invalid JSON format. Please correct it to see changes reflected.');
    }
  }, [currentFields, onFieldsChange]);

  const handleJsonBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && !isEqual(parsed, currentFields)) {
        onFieldsChange(parsed);
        setError(null);
      } else if (!Array.isArray(parsed)) {
         setError('JSON must be an array of field objects.');
      }
    } catch (e) {
      setError('Invalid JSON format.');
    }
  }, [json, currentFields, onFieldsChange]);


  // onBlockEdit is now effectively unused as the pencil icon opens the full dialog
  const onBlockEdit = useCallback((indexPath, updatedFields) => {
    onFieldsChange(prev =>
      updateByIndexPath(prev, indexPath, item => ({
        ...item,
        ...updatedFields
      }))
    );
  }, [onFieldsChange]);

  const onMove = useCallback((indexPath, direction) => {
    onFieldsChange(prev => moveItemInNestedArray(prev, indexPath, direction));
  }, [onFieldsChange]);

  // The onAddField from BlockTree for nested additions is now handled by the InputBuilder's onSubmit
  // (via a new 'mode' flag)
  const onAddField = useCallback((parentPath, newField) => {
    onFieldsChange(prev => {
      // Logic for adding a new field (always as a child of parentPath)
      return updateByIndexPath(prev, parentPath, (item) => {
        const currentChildren = Array.isArray(item.children) ? item.children : [];
        return {
          ...item,
          children: [...currentChildren, newField],
        };
      });
    });
  }, [onFieldsChange]);


  const onBlockDelete = useCallback((indexPath) => {
    onFieldsChange(prev => {
        if (indexPath.length === 1) {
            const newArr = [...prev];
            newArr.splice(indexPath[0], 1);
            return newArr;
        }
        return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => {
            const indexToDelete = indexPath[indexPath.length - 1];
            const newChildren = [...parent.children];
            newChildren.splice(indexToDelete, 1);
            return { ...parent, children: newChildren };
        });
    });
  }, [onFieldsChange]);

  const onBlockDuplicate = useCallback((indexPath) => {
    onFieldsChange(prev => {
        if (indexPath.length === 1) {
            const itemToDuplicate = prev[indexPath[0]];
            const duplicatedItem = { ...itemToDuplicate, id: `${itemToDuplicate.id}-copy-${Date.now()}` };
            const newArr = [...prev];
            newArr.splice(indexPath[0] + 1, 0, duplicatedItem);
            return newArr;
        }
        return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => {
            const indexToDuplicate = indexPath[indexPath.length - 1];
            const itemToDuplicate = parent.children[indexToDuplicate];
            const duplicatedItem = { ...itemToDuplicate, id: `${itemToDuplicate.id}-copy-${Date.now()}` };
            const newChildren = [...parent.children];
            newChildren.splice(indexToDuplicate + 1, 0, duplicatedItem);
            return { ...parent, children: newChildren };
        });
    });
  }, [onFieldsChange]);


  return (
    <>
      {showJsonEditorOnly ? (
        <div className="w-full h-full flex flex-col">
          <JsonEditor
            value={json}
            onChange={handleJsonChange}
            onBlur={handleJsonBlur}
          />
          {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
        </div>
      ) : (
        <div className="w-full h-full">
          {/* REMOVED: "Add New Field" button from here. It's now added from the left panel's "Advanced Field Options" or via pencil icon. */}
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
                onBlockEdit={onBlockEdit} // Still passed, but not used by pencil icon directly
                onMove={onMove}
                onBlockDelete={onBlockDelete}
                onBlockDuplicate={onBlockDuplicate}
                onAddField={onAddField} // Still passed for deeper nesting but now from within InputBuilder dialog
                onOpenInputBuilderForEdit={onOpenInputBuilderForEdit} // This is the key for the pencil icon
                parentLength={currentFields.length}
              />
            );
          })}
        </div>
      )}
    </>
  );
}