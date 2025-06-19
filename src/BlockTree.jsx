import React from 'react';
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

const BlockTree = React.memo(function BlockTree({
  blockId,
  blockData,      // The block's data (info object)
  childarr = [],  // Array of child IDs
  childblocks = {}, // Child blocks object
  level = 0,
  indexPath = [],
  onBlockEdit,
  onMove,
  parentLength
}) {
  const [editMode, setEditMode] = React.useState(false);
  const [editBuffer, setEditBuffer] = React.useState({});

  // Initialize edit buffer with current block data
  React.useEffect(() => {
    if (editMode) {
      const buf = {};
      editableFields.forEach(f => {
        buf[f] = blockData[f] || '';
      });
      setEditBuffer(buf);
    }
  }, [editMode, blockData]);

  // Memoized move handlers
  const handleMoveUp = React.useCallback(() => {
    onMove(indexPath, 'up');
  }, [indexPath, onMove]);

  const handleMoveDown = React.useCallback(() => {
    onMove(indexPath, 'down');
  }, [indexPath, onMove]);

  const handleFieldChange = React.useCallback((field, value) => {
    setEditBuffer(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = React.useCallback(() => {
    setEditMode(false);
    onBlockEdit(indexPath, editBuffer);
  }, [editBuffer, indexPath, onBlockEdit]);

  const handleCancel = React.useCallback(() => {
    setEditMode(false);
  }, []);

  const toggleEditMode = React.useCallback(() => {
    setEditMode(prev => !prev);
  }, []);

  if (!blockData) return null;

  const currentIndex = indexPath[indexPath.length - 1];
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < parentLength - 1;

  return (
    <Card className={`${level > 0 ? `pl-${Math.min(level * 6, 24)}` : ''}`} variant="outlined">
      <CardContent>
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
            {childarr.map((childId, idx) => (
              <BlockTree
                key={childId}
                blockId={childId}
                blockData={childblocks[childId]?.info || {}}
                childarr={childblocks[childId]?.childarr || []} // added these three entries
                childblocks={childblocks[childId]?.childblocks || {}}
                level={level + 1}
                indexPath={[...indexPath, idx]}
                onBlockEdit={onBlockEdit}
                onMove={onMove}
                parentLength={childarr.length}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export { BlockTree };