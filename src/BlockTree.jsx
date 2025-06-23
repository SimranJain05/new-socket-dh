// File: BlockTree.jsx

import React, { useState, useCallback, useMemo } from 'react';
import isEqual from 'lodash.isequal';
import {
  Card, CardContent, Typography, IconButton, TextField
} from '@mui/material';
import {
  Edit as EditIcon, Check as SaveIcon, Close as CancelIcon,
  ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon,
  ContentCopy as ContentCopyIcon, Delete as DeleteIcon
} from '@mui/icons-material';

const editableFields = ['title', 'placeholder', 'help'];

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
  const [editBuffer, setEditBuffer] = useState({});

  const displayBlockData = useMemo(() => blockData || {}, [blockData]);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => {
      if (!prev) {
        const buf = {};
        editableFields.forEach(f => {
          buf[f] = displayBlockData[f] || '';
        });
        setEditBuffer(buf);
      }
      return !prev;
    });
  }, [displayBlockData]);

  const handleMove = useCallback((direction) => {
    onMove(indexPath, direction);
  }, [indexPath, onMove]);

  const handleFieldChange = useCallback((field, value) => {
    setEditBuffer(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    setEditMode(false);
    onBlockEdit(indexPath, editBuffer);
  }, [indexPath, editBuffer, onBlockEdit]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Delete "${displayBlockData?.title || blockId}"?`)) {
      onBlockDelete(indexPath);
    }
  }, [indexPath, onBlockDelete, displayBlockData?.title, blockId]);

  const handleDuplicate = useCallback(() => {
    onBlockDuplicate(indexPath);
  }, [indexPath, onBlockDuplicate]);

  const handleFullEdit = useCallback(() => {
    onOpenInputBuilderForEdit(indexPath, displayBlockData);
  }, [indexPath, displayBlockData, onOpenInputBuilderForEdit]);

  const canMoveUp = indexPath[indexPath.length - 1] > 0;
  const canMoveDown = indexPath[indexPath.length - 1] < parentLength - 1;

  if (!blockData) return null;

  return (
    <Card variant="outlined" className={`${level > 0 ? `pl-${Math.min(level * 6, 24)}` : ''}`}>
      <CardContent>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Typography variant="subtitle1" fontWeight={600} className="text-blue-800">
                {blockId}
              </Typography>
              <IconButton size="small" onClick={() => handleMove('up')} disabled={!canMoveUp}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleMove('down')} disabled={!canMoveDown}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </div>
            <div>
              <IconButton size="small" onClick={handleFullEdit}><EditIcon /></IconButton>
              <IconButton size="small" onClick={handleDuplicate}><ContentCopyIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={handleDelete}><DeleteIcon fontSize="small" color="error" /></IconButton>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-gray-800 text-sm mb-2">
            {Object.entries(displayBlockData).map(([k, v]) => {
              if (k === 'children' && (Array.isArray(v) && v.length === 0 || typeof v === 'string')) return null;
              if (k === 'options' && Array.isArray(v)) {
                return <span key={k}><b>{k}</b>: {v.map(opt => `${opt.label}:${opt.value}`).join(', ')};</span>;
              }
              if (k === 'dynamicChildren' || k === 'dynamicOptions') {
                return <span key={k}><b>{k}</b>: <code style={{ backgroundColor: '#eee', padding: '2px 4px', borderRadius: '3px' }}>{String(v)}</code>;</span>;
              }
              if (k === 'label' && displayBlockData.title) return null;
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
                    blockData={childBlock?.info || {}}
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

const MemoizedBlockTree = React.memo(BlockTree, (prev, next) =>
  prev.blockId === next.blockId &&
  prev.level === next.level &&
  prev.parentLength === next.parentLength &&
  isEqual(prev.blockData, next.blockData) &&
  isEqual(prev.childarr, next.childarr) &&
  isEqual(prev.childblocks, next.childblocks) &&
  isEqual(prev.indexPath, next.indexPath)
);

export { BlockTree, MemoizedBlockTree };
