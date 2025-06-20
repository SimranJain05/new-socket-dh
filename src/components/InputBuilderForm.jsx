import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, Box, TextField, Checkbox, FormControlLabel, Select, MenuItem, IconButton, Tooltip, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import isEqual from 'lodash.isequal';

function InputBuilderBlock({ blockId, block, index, orderLength, level, indexPath, onMove, onDelete }) {
  const { info, childarr, childblocks } = block;
  let field = null;
  switch (info.type) {
  case 'textField':
    field = (
      <TextField
        size="small"
        label={info.title || info.label || info.id}
        placeholder={info.placeholder}
        required={info.required}
        type={info.inputType || 'text'}
        defaultValue={info.defaultValue}
        sx={{ mb: 1, minWidth: 200 }}
      />
    );
    break;
  case 'checkbox':
    field = (
      <FormControlLabel
        control={<Checkbox defaultChecked={!!info.defaultValue} />}
        label={info.title || info.label || info.id}
        sx={{ mb: 1 }}
      />
    );
    break;
  case 'dropdown': {
    const options = info.options || [];
    // allowMultiSelect: true => use multiple Select
    field = (
      <Select
        size="small"
        displayEmpty
        multiple={!!info.allowMultiSelect}
        defaultValue={info.allowMultiSelect ? [] : ''}
        sx={{ mb: 1, minWidth: 200 }}
        renderValue={selected => {
          if (!selected || (Array.isArray(selected) && selected.length === 0)) {
            return <span className="text-gray-400">{info.title || info.label || info.id}</span>;
          }
          if (Array.isArray(selected)) {
            return selected.map(val => options.find(opt => opt.value === val)?.label || val).join(', ');
          }
          return options.find(opt => opt.value === selected)?.label || selected;
        }}
      >
        <MenuItem value="" disabled>{info.title || info.label || info.id}</MenuItem>
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </Select>
    );
    break;
  }
  case 'radioGroup': {
    const options = info.options || [];
    field = (
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" className="mb-1">{info.title || info.label || info.id}</Typography>
        <RadioGroup row defaultValue={info.defaultValue}>
          {options.map(opt => (
            <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
          ))}
        </RadioGroup>
      </Box>
    );
    break;
  }
  case 'inputGroup': {
    field = (
      <Box sx={{ mb: 2, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
        <Typography variant="subtitle2" className="mb-1">{info.title || info.label || info.id}</Typography>
        {Array.isArray(info.children) && (
          <MemoizedInputBuilderForm
            order={info.children.map(child => child.id)}
            blocks={Object.fromEntries(info.children.map(child => [child.id, { info: child }]))}
            level={level + 1}
            indexPath={[...indexPath, index]}
            onMove={onMove}
            onDelete={onDelete}
          />
        )}
      </Box>
    );
    break;
  }
  case 'attachment': {
    field = (
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2">{info.title || info.label || info.id}</Typography>
        <Button variant="outlined" component="label" size="small" sx={{ mt: 1 }}>
          Upload File
          <input type="file" hidden accept={(info.accept || []).join(',')} />
        </Button>
        {info.maxFileSizeMB && (
          <Typography variant="caption" color="text.secondary">Max size: {info.maxFileSizeMB} MB</Typography>
        )}
      </Box>
    );
    break;
  }
  case 'textArea': {
    field = (
      <TextField
        size="small"
        label={info.title || info.label || info.id}
        placeholder={info.placeholder}
        required={info.required}
        multiline
        minRows={info.rows || 3}
        inputProps={{ maxLength: info.maxLength || undefined }}
        defaultValue={info.defaultValue}
        sx={{ mb: 1, minWidth: 200 }}
      />
    );
    break;
  }
  case 'date': {
    // Requires @mui/x-date-pickers
    field = (
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2">{info.title || info.label || info.id}</Typography>
        <DatePicker
          slotProps={{ textField: { size: 'small', required: info.required, sx: { minWidth: 200 } } }}
          minDate={info.minDate || undefined}
          maxDate={info.maxDate || undefined}
        />
      </Box>
    );
    break;
  }
  default:
    field = (
      <TextField
        size="small"
        label={info.title || info.label || info.id}
        placeholder={info.placeholder}
        sx={{ mb: 1, minWidth: 200 }}
      />
    );
}
  const canMoveUp = index > 0;
  const canMoveDown = index < orderLength - 1;
  return (
    <Card variant="outlined" sx={{ mb: 2, background: level === 0 ? '#f5f7fa' : '#f8fafc' }}>
      <CardContent sx={{pb: '8px!important', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Move Up"><span><IconButton size="small" disabled={!canMoveUp} onClick={() => onMove([...indexPath, index], 'up')}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title="Move Down"><span><IconButton size="small" disabled={!canMoveDown} onClick={() => onMove([...indexPath, index], 'down')}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
        </Box>
        <Box>
          {field}
          {Array.isArray(childarr) && childarr.length > 0 && (
            <MemoizedInputBuilderForm order={childarr} blocks={childblocks} level={level + 1} indexPath={[...indexPath, index]} onMove={onMove} onDelete={onDelete} />
          )}
        </Box>
        <Tooltip title="Delete"><span><IconButton size="small" color="error" onClick={() => onDelete([...indexPath, index])}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
      </CardContent>
    </Card>
  );
}

const MemoizedInputBuilderBlock = React.memo(InputBuilderBlock, (prev, next) => {
  return (
    prev.blockId === next.blockId &&
    isEqual(prev.block, next.block) &&
    prev.index === next.index &&
    prev.orderLength === next.orderLength &&
    prev.level === next.level &&
    isEqual(prev.indexPath, next.indexPath)
  );
}); // already uses isEqual for block and indexPath, correct as is.

function InputBuilderForm({ order, blocks, level = 0, indexPath = [], onMove, onDelete }) {
  const memoizedOrder = useMemo(() => order, [order]);
  const memoizedBlocks = useMemo(() => blocks, [blocks]);
  if (!memoizedOrder || !memoizedBlocks) return null;
  return (
    <Box sx={{ pl: Math.min(level * 4, 32) }}>
      {memoizedOrder.map((blockId, idx) => {
        const block = memoizedBlocks[blockId];
        if (!block) return null;
        return (
          <MemoizedInputBuilderBlock
            key={blockId}
            blockId={blockId}
            block={block}
            index={idx}
            orderLength={memoizedOrder.length}
            level={level}
            indexPath={indexPath}
            onMove={onMove}
            onDelete={onDelete}
          />
        );
      })}
    </Box>
  );
}

const MemoizedInputBuilderForm = React.memo(InputBuilderForm, (prev, next) => {
  return (
    isEqual(prev.order, next.order) &&
    isEqual(prev.blocks, next.blocks) &&
    prev.level === next.level &&
    isEqual(prev.indexPath, next.indexPath)
  );
});

export { InputBuilderForm, MemoizedInputBuilderForm };
