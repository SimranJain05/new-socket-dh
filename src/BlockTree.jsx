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

  if (!blockData) return null;

  const currentIndex = indexPath[indexPath.length - 1];
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < parentLength - 1;
  console.log("BlocksData",blockData)
  return (
    <Card className={`${level > 0 ? `pl-${Math.min(level * 6, 24)}` : ''}`} variant="outlined">
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
            {editMode ? (
              <div>
                <IconButton size="small" onClick={handleSave} color="primary"><SaveIcon /></IconButton>
                <IconButton size="small" onClick={handleCancel}><CancelIcon /></IconButton>
              </div>
            ) : (
              <IconButton size="small" onClick={toggleEditMode}><EditIcon /></IconButton>
            )}
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


              Object.entries(blockData).map(([k, v]) => (
                <span key={k}><b>{k}</b>: {String(v)};</span>
              ))


            )}
          </div>
          {childarr.length > 0 && (
            <div>
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
  return isEqual(prevProps, nextProps);
});

export { BlockTree, MemoizedBlockTree };