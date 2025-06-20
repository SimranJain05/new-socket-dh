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

const BlockTree = React.memo(function BlockTree({
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
  const [editMode, setEditMode] = React.useState(false);
  const [editBuffer, setEditBuffer] = React.useState({});

  const editableKeys = React.useMemo(() => {
    return Object.keys(blockData || {}).filter(k => typeof blockData[k] !== 'object');
  }, [blockData]);

  React.useEffect(() => {
    if (editMode && blockData) {
      const buf = {};
      editableKeys.forEach(key => {
        buf[key] = blockData[key] || '';
      });
      setEditBuffer(buf);
    }
  }, [editMode, blockData, editableKeys]);

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
    <Card className={`my-2 border ${level > 0 ? `pl-${Math.min(level * 6, 24)}` : ''}`} variant="outlined">
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Typography variant="subtitle1" fontWeight={600} className="text-blue-800">
              {blockId}
            </Typography>
            {typeof currentIndex === 'number' && typeof parentLength === 'number' && (
              <>
                <IconButton size="small" onClick={handleMoveUp} disabled={!canMoveUp}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleMoveDown} disabled={!canMoveDown}>
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
            editableKeys.map(key => (
              <TextField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={editBuffer[key]}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                size="small"
                className="w-full"
              />
            ))
          ) : (
            Object.entries(blockData).map(([k, v]) => (
              <span key={k}><b>{k}</b>: {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '[object]'}</span>
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
                childarr={childblocks[childId]?.childarr || []}
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
