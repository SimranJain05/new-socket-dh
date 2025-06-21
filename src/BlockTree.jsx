import React, { useState, useCallback } from 'react';
import isEqual from 'lodash.isequal';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit'; // Pencil icon
import SaveIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import InputBuilder from './components/InputBuilder';

const editableFields = ['title', 'placeholder', 'help']; // These are the fields currently editable inline

function BlockTree({
  blockId,
  blockData,
  childarr = [],
  childblocks = {},
  level = 0,
  indexPath = [],
  onBlockEdit,
  onMove,
  onBlockDelete,
  onBlockDuplicate,
  onAddField,
  onOpenInputBuilderForEdit,
  parentLength
}) {
  const [editMode, setEditMode] = useState(false);
  // Ensure editBuffer is always an object
  const [editBuffer, setEditBuffer] = useState({}); // Initialize as an empty object

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => {
      if (!prev) {
        const buf = {};
        editableFields.forEach(f => {
          buf[f] = blockData?.[f] || ''; // Add safe navigation
        });
        setEditBuffer(buf);
      }
      return !prev;
    });
  }, [blockData]);

  const handleMoveUp = useCallback(() => {
    onMove(indexPath, 'up');
  }, [indexPath, onMove]);

  const handleMoveDown = useCallback(() => {
    onMove(indexPath, 'down');
  }, [indexPath, onMove]);

  const handleFieldChange = useCallback((field, value) => {
    setEditBuffer(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    setEditMode(false);
    onBlockEdit(indexPath, editBuffer);
  }, [editBuffer, indexPath, onBlockEdit]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete field "${blockData?.title || blockId}"?`)) { // Added safe navigation
      onBlockDelete(indexPath);
    }
  }, [indexPath, onBlockDelete, blockData?.title, blockId]); // Added safe navigation

  const handleDuplicate = useCallback(() => {
    onBlockDuplicate(indexPath);
  }, [indexPath, onBlockDuplicate]);

  const handleFullEdit = useCallback(() => {
    onOpenInputBuilderForEdit(indexPath, blockData);
  }, [blockData, indexPath, onOpenInputBuilderForEdit]);

  // --- FIX APPLIED HERE ---
  // Ensure blockData is an object before iterating over it.
  // If blockData is null or undefined, default to an empty object.
  const displayBlockData = blockData || {};

  if (!blockData) return null; // If no blockData, don't render anything

  const currentIndex = indexPath[indexPath.length - 1];
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < parentLength - 1;

  return (
    <Card className={`${level > 0 ? `pl-${Math.min(level * 6, 24)}` : ''} mb-2`} variant="outlined">
      <CardContent>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Typography variant="subtitle1" fontWeight={600} className="text-blue-800">
                {blockId}
              </Typography>
              {typeof currentIndex === 'number' && typeof parentLength === 'number' && (
                <>
                  <IconButton
                    size="small"
                    onClick={handleMoveUp}
                    disabled={!canMoveUp}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleMoveDown}
                    disabled={!canMoveDown}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </div>
            <div>
              <IconButton size="small" onClick={handleFullEdit}><EditIcon /></IconButton>
              <IconButton size="small" onClick={handleDuplicate}><ContentCopyIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={handleDelete}><DeleteIcon fontSize="small" color="error" /></IconButton>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-gray-800 text-sm mb-2">
            {/* Iterating over displayBlockData which is guaranteed to be an object */}
            {Object.entries(displayBlockData).map(([k, v]) => {
              if (k === 'children' && (Array.isArray(v) && v.length === 0 || typeof v === 'string')) return null;
              if (k === 'options' && Array.isArray(v)) {
                  return <span key={k}><b>{k}</b>: {v.map(opt => `${opt.label}:${opt.value}`).join(', ')};</span>;
              }
              if (k === 'dynamicChildren' || k === 'dynamicOptions') {
                  return <span key={k}><b>{k}</b>: <code style={{backgroundColor: '#eee', padding: '2px 4px', borderRadius: '3px'}}>{String(v)}</code>;</span>;
              }
              if (k === 'label' && displayBlockData.title) return null; // Use displayBlockData here too
              return <span key={k}><b>{k}</b>: {String(v)};</span>;
            })}
          </div>
          {childarr.length > 0 && (
            <div className="mt-2" style={{ borderLeft: '2px solid #ddd', paddingLeft: '8px', marginLeft: '4px' }}>
              {childarr.map((childId, idx) => {
                const childBlock = childblocks[childId];
                return (
                  <MemoizedBlockTree
                    key={childId}
                    blockId={childId}
                    blockData={childBlock?.info || {}} // Ensure this fallback to empty object is always active
                    childarr={childBlock?.childarr || []}
                    childblocks={childBlock?.childblocks || {}}
                    level={level + 1}
                    indexPath={[...indexPath, idx]}
                    onBlockEdit={onBlockEdit}
                    onMove={onMove}
                    onBlockDelete={onBlockDelete}
                    onBlockDuplicate={onBlockDuplicate}
                    onAddField={onAddField}
                    onOpenInputBuilderForEdit={onOpenInputBuilderForEdit}
                    parentLength={childarr.length}
                  />
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const MemoizedBlockTree = React.memo(BlockTree, (prevProps, nextProps) => {
  return (
    prevProps.blockId === nextProps.blockId &&
    prevProps.level === nextProps.level &&
    prevProps.parentLength === nextProps.parentLength &&
    isEqual(prevProps.blockData, nextProps.blockData) &&
    isEqual(prevProps.childarr, nextProps.childarr) &&
    isEqual(prevProps.childblocks, nextProps.childblocks) &&
    isEqual(prevProps.indexPath, nextProps.indexPath)
  );
});

export { BlockTree, MemoizedBlockTree };