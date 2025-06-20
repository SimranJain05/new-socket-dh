import React, { useState, useCallback, useMemo } from 'react';
import { input } from '../inputData.js';
import { convertToOrderBlocks, moveItemInNestedArray, updateByIndexPath } from '../utils.js';
import { MemoizedBlockTree } from '../BlockTree.jsx';
import JsonEditor from '../components/JsonEditor.jsx';
import FormRenderer from './FormRenderer.jsx';


export default function BlockOrderPage() {
  const [json, setJson] = useState(JSON.stringify(input, null, 2));
  const [inputArr, setInputArr] = useState(input);
  const [error, setError] = useState(null);
  const [showFormPreview, setShowFormPreview] = useState(false); // ✅ Toggle state

  const result = useMemo(() => convertToOrderBlocks(inputArr), [inputArr]);

  const handleJsonChange = useCallback((val) => {
    setJson(val);
  }, []);

  const handleJsonBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(json);
      setInputArr(parsed);
      setError(null);
    } catch (e) {
      setError('Invalid JSON');
    }
  }, [json]);

  React.useEffect(() => {
    setJson(JSON.stringify(inputArr, null, 2));
  }, [inputArr]);

  const onBlockEdit = useCallback((indexPath, updatedFields) => {
    setInputArr(prev =>
      updateByIndexPath(prev, indexPath, item => ({
        ...item,
        ...updatedFields
      }))
    );
  }, []);

  const onMove = useCallback((indexPath, direction) => {
    setInputArr(prev => moveItemInNestedArray(prev, indexPath, direction));
  }, []);

  return (
    <div className="flex w-full gap-4 p-4">
      {/* Left Column */}
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

      {/* Right Column */}
      <div className="w-1/2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">
            {showFormPreview ? 'Form Preview' : 'Rendered Block Tree'}
          </h2>
          <button
            onClick={() => setShowFormPreview(prev => !prev)}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showFormPreview ? 'Show Block Tree' : 'Show Form Preview'}
          </button>
        </div>

        <div className="h-full border rounded p-4">
          {showFormPreview ? (
            <FormRenderer blocks={result.blocks} order={result.order} />
          ) : (
            result.order.map((blockId, i) => {
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
