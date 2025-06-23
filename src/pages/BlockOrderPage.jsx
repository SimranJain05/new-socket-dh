import React, { useState, useCallback, useMemo, useEffect, useDeferredValue, useRef } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks, moveItemInNestedArray, updateByIndexPath } from '../utils.js';
import { MemoizedBlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';
import isEqual from 'lodash.isequal';
import debounce from 'lodash.debounce';

export default function BlockOrderPage({
  showJsonEditorOnly = false,
  fields,
  onFieldsChange,
  onOpenInputBuilderForEdit,
}) {
  const currentFields = useMemo(() => fields || input, [fields]);
  const [json, setJson] = useState(() => JSON.stringify(currentFields, null, 2));
  const [error, setError] = useState(null);
  const deferredJson = useDeferredValue(json);
  const jsonRef = useRef(json);

  // Keep local JSON in sync with external `fields`
  useEffect(() => {
    const newJson = JSON.stringify(currentFields, null, 2);
    if (jsonRef.current !== newJson) {
      jsonRef.current = newJson;
      setJson(newJson);
      setError(null);
    }
  }, [currentFields]);

  // JSON editor change handler (debounced)
  const debouncedUpdate = useMemo(
    () =>
      debounce((val, parsed) => {
        if (!isEqual(parsed, currentFields)) {
          onFieldsChange(parsed);
        }
        setError(null);
      }, 300),
    [currentFields, onFieldsChange]
  );

  const handleJsonChange = useCallback((val) => {
    setJson(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        debouncedUpdate(val, parsed);
      }
    } catch {
      setError('Invalid JSON format.');
    }
  }, [debouncedUpdate]);

  const handleJsonBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        if (!isEqual(parsed, currentFields)) {
          onFieldsChange(parsed);
        }
        setError(null);
      } else {
        setError('JSON must be an array of field objects.');
      }
    } catch {
      setError('Invalid JSON format.');
    }
  }, [json, currentFields, onFieldsChange]);

  const result = useMemo(() => convertToOrderBlocks(currentFields), [currentFields]);

  const onBlockEdit = useCallback((indexPath, updatedFields) => {
    onFieldsChange(prev =>
      updateByIndexPath(prev, indexPath, item => ({ ...item, ...updatedFields }))
    );
  }, [onFieldsChange]);

  const onMove = useCallback((indexPath, direction) => {
    onFieldsChange(prev => moveItemInNestedArray(prev, indexPath, direction));
  }, [onFieldsChange]);

  const onBlockDelete = useCallback((indexPath) => {
    onFieldsChange(prev => {
      if (indexPath.length === 1) {
        const newArr = [...prev];
        newArr.splice(indexPath[0], 1);
        return newArr;
      }
      return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => {
        const indexToDelete = indexPath.at(-1);
        const newChildren = [...parent.children];
        newChildren.splice(indexToDelete, 1);
        return { ...parent, children: newChildren };
      });
    });
  }, [onFieldsChange]);

  const onBlockDuplicate = useCallback((indexPath) => {
    onFieldsChange(prev => {
      const now = Date.now();
      if (indexPath.length === 1) {
        const item = prev[indexPath[0]];
        const dup = { ...item, id: `${item.id}-copy-${now}` };
        const newArr = [...prev];
        newArr.splice(indexPath[0] + 1, 0, dup);
        return newArr;
      }
      return updateByIndexPath(prev, indexPath.slice(0, -1), (parent) => {
        const idx = indexPath.at(-1);
        const item = parent.children[idx];
        const dup = { ...item, id: `${item.id}-copy-${now}` };
        const newChildren = [...parent.children];
        newChildren.splice(idx + 1, 0, dup);
        return { ...parent, children: newChildren };
      });
    });
  }, [onFieldsChange]);

  const onAddField = useCallback((parentPath, newField) => {
    onFieldsChange(prev =>
      updateByIndexPath(prev, parentPath, item => ({
        ...item,
        children: [...(item.children || []), newField],
      }))
    );
  }, [onFieldsChange]);

  return (
    <>
      {showJsonEditorOnly ? (
        <div className="w-full h-full flex flex-col">
          <JsonEditor value={json} onChange={handleJsonChange} onBlur={handleJsonBlur} />
          {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
        </div>
      ) : (
        <div className="w-full h-full">
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
                onBlockDelete={onBlockDelete}
                onBlockDuplicate={onBlockDuplicate}
                onAddField={onAddField}
                onOpenInputBuilderForEdit={onOpenInputBuilderForEdit}
                parentLength={currentFields.length}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
