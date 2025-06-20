import React, { useState, useCallback } from 'react';
import isEqual from 'lodash.isequal';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Import for Duplicate
import DeleteIcon from '@mui/icons-material/Delete'; // Import for Delete
import InputBuilder from './components/InputBuilder'; // Still needed for nested adding

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
  onBlockDelete, // New prop
  onBlockDuplicate, // New prop
  onAddField, // New prop (for nested adds)
  parentLength
}) {
  const [editMode, setEditMode] = useState(false);
  const [editBuffer, setEditBuffer] = useState({});

  // Initialize edit buffer only when entering edit mode
  const toggleEditMode = useCallback(() => {
    setEditMode(prev => {
      if (!prev) {
        const buf = {};
        editableFields.forEach(f => {
          buf[f] = blockData[f] || '';
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
    if (window.confirm(`Are you sure you want to delete field "${blockData.title || blockId}"?`)) {
      onBlockDelete(indexPath);
    }
  }, [indexPath, onBlockDelete, blockData.title, blockId]);

  const handleDuplicate = useCallback(() => {
    onBlockDuplicate(indexPath);
  }, [indexPath, onBlockDuplicate]);

  // This will be for opening a comprehensive edit dialog, potentially using InputBuilder
  // For now, it just logs, as InputBuilder itself needs modification to support an "edit" mode
  const handleFullEdit = useCallback(() => {
    console.log("Full edit triggered for field:", blockId, blockData);
    // TODO: Open InputBuilder dialog pre-filled with blockData for full editing
    // This would involve passing blockData to InputBuilder and changing its behavior based on a prop.
  }, [blockId, blockData]);


  if (!blockData) return null;

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
            {/* Action buttons as per UI image */}
            <div>
              {editMode ? (
                <>
                  <IconButton size="small" onClick={handleSave} color="primary"><SaveIcon /></IconButton>
                  <IconButton size="small" onClick={handleCancel}><CancelIcon /></IconButton>
                </>
              ) : (
                <>
                  {/* The main "Edit" button, ideally opens a full InputBuilder dialog */}
                  <IconButton size="small" onClick={handleFullEdit}><EditIcon /></IconButton>
                  <IconButton size="small" onClick={handleDuplicate}><ContentCopyIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={handleDelete}><DeleteIcon fontSize="small" color="error" /></IconButton>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-gray-800 text-sm mb-2">
            {editMode ? (
              editableFields.map(field => (
                <TextField
                  key={field}
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={editBuffer[field] || ''}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  size="small"
                  className="w-64"
                />
              ))
            ) : (
              // Display all relevant blockData properties
              Object.entries(blockData).map(([k, v]) => {
                if (k === 'children' && (Array.isArray(v) && v.length === 0 || typeof v === 'string')) return null; // Don't display empty children or dynamic children string here
                if (k === 'options' && Array.isArray(v)) {
                    return <span key={k}><b>{k}</b>: {v.map(opt => `${opt.label}:${opt.value}`).join(', ')};</span>;
                }
                if (k === 'dynamicChildren' || k === 'dynamicOptions') {
                    return <span key={k}><b>{k}</b>: <code style={{backgroundColor: '#eee', padding: '2px 4px', borderRadius: '3px'}}>{String(v)}</code>;</span>;
                }
                return <span key={k}><b>{k}</b>: {String(v)};</span>;
              })
            )}
          </div>
          {childarr.length > 0 && (
            <div className="mt-2" style={{ borderLeft: '2px solid #ddd', paddingLeft: '8px', marginLeft: '4px' }}> {/* Visual nesting */}
              <div className="mb-2">
                <InputBuilder
                  onAddField={onAddField} // Use the new onAddField for nested additions
                  parentPath={indexPath}
                />
              </div>
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
                    onBlockDelete={onBlockDelete} // Pass through
                    onBlockDuplicate={onBlockDuplicate} // Pass through
                    onAddField={onAddField} // Pass through for deeper nesting
                    parentLength={childarr.length}
                  />
                );
              })}
            </div>
          )}
          {blockData.type === 'input_group' && childarr.length === 0 && (
            <div className="mt-2">
              <InputBuilder
                onAddField={onAddField} // Use the new onAddField for adding to empty input groups
                parentPath={indexPath}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const MemoizedBlockTree = React.memo(BlockTree, (prevProps, nextProps) => {
  return isEqual(prevProps, nextProps);
});

export { BlockTree, MemoizedBlockTree };