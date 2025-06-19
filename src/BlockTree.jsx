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

const BlockTree = React.memo(function BlockTree({ blockId, blocks, level = 0, indexPath = [], onBlockEdit, onMove, parentLength }) {
  const block = blocks[blockId];
  const [editMode, setEditMode] = React.useState(false);
  const [editBuffer, setEditBuffer] = React.useState({});

  React.useEffect(() => {
    if (editMode) {
      // Initialize editBuffer with current editable fields
      const buf = {};
      editableFields.forEach(f => {
        buf[f] = block.info[f] || '';
      });
      setEditBuffer(buf);
    }
    // eslint-disable-next-line
  }, [editMode, blockId]);

  if (!block) return null;

  const handleFieldChange = (field, value) => {
    setEditBuffer(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setEditMode(false);
    console.log("onBlockEdit: ", onBlockEdit)
    if (onBlockEdit) {
      onBlockEdit(indexPath, editBuffer);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  // console.log("indexPath", indexPath)

  return (
    <Card className={`${level > 0 ? `pl-${Math.min(level * 6, 24)}` : ''}`} variant="outlined">
      <CardContent>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Typography variant="subtitle1" fontWeight={600} className="text-blue-800">
              {blockId}
            </Typography>
            {/* Move arrows */}
            {typeof indexPath[indexPath.length-1] === 'number' && typeof parentLength === 'number' && (
              <>
                <IconButton
                  size="small"
                  onClick={() => onMove(indexPath, 'up')}
                  disabled={indexPath[indexPath.length-1] === 0}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onMove(indexPath, 'down')}
                  disabled={indexPath[indexPath.length-1] === parentLength - 1}
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
            <IconButton size="small" onClick={() => setEditMode(true)}><EditIcon /></IconButton>
          )}
        </div>
        <div className="flex flex-col gap-2 text-gray-800 text-sm mb-2">
          {editMode ? (
            editableFields.map(field => (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={editBuffer[field] || ''}
                onChange={e => handleFieldChange(field, e.target.value)}
                size="small"
                className="w-64"
              />
            ))
          ) : (
            Object.entries(block.info).map(([k, v]) => (
              <span key={k}><b>{k}</b>: {String(v)};</span>
            ))
          )}
        </div>
        {block.childarr.length > 0 && (
          <div>
            {block.childarr.map((childId, idx) => (
              <BlockTree
                key={childId}
                blockId={childId}
                blocks={block.childblocks}
                level={level + 1}
                indexPath={[...indexPath, idx]}
                onBlockEdit={onBlockEdit}
                onMove={onMove}
                parentLength={block.childarr.length}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export { BlockTree };
