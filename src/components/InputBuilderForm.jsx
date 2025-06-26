import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Box, TextField, Checkbox, FormControlLabel, Select, MenuItem, IconButton, Tooltip, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import isEqual from 'lodash.isequal';
import { useDispatch, useSelector } from 'react-redux';

function InputBuilderBlock({ blockId, block, index, level, indexPath, idPath, onDelete, onReorder }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: blockId });
  const styleWrapper = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const dispatch = useDispatch();
  const { info, childarr, childblocks } = block;
  const depends = info.depends_on || [];
  const myIdPath = idPath ? [...idPath, info.id] : [info.id];
  // Helper to get nested value by idPath
  function getNested(obj, path) {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  // Subscribe ONLY to the value this field cares about
  const value = useSelector(
    state => getNested(state.userResponse, myIdPath),
    isEqual
  );

  // Subscribe to the computed disabled flag (depends_on)
  const isDisabled = useSelector(
    state => depends.length > 0 && depends.some(depPath => {
      const arrPath = Array.isArray(depPath) ? depPath : [depPath];
      const val = getNested(state.userResponse, arrPath);
      return !val && val !== 0 && val !== false;
    }),
    (prev, next) => prev === next // boolean compare
  );

  const [localValue, setLocalValue] = useState(info.allowMultiSelect ? [] : '');

  useEffect(() => {
    // Sync localValue from Redux value if present, else default
    if (typeof value !== 'undefined') {
      setLocalValue(value);
    } else {
      setLocalValue(info.allowMultiSelect ? [] : '');
    }
    // eslint-disable-next-line
  }, [value, info.allowMultiSelect]);

  useEffect(() => {
    // Clear current field if it depends on something that is now invalid
    if (isDisabled && value !== undefined && value !== '' && value !== null) {
      dispatch({ type: 'userResponse/updateUserResponse', payload: { idPath: myIdPath, value: info.allowMultiSelect ? [] : '' } });
    }
  }, [isDisabled]); // <-- only trigger this if isDisabled change

  function handleBlur() {
    dispatch({ type: 'userResponse/updateUserResponse', payload: { idPath: myIdPath, value: localValue } });
  }
  let field = null;
  switch (info.type) {
  case 'textField':
    field = (
      <TextField
        size="small"
        label={info.title || info.label}
        placeholder={info.placeholder}
        required={info.required}
        type={info.inputType || 'text'}
        // defaultValue={info.defaultValue}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isDisabled}
        sx={{ mb: 1, minWidth: 200 }}
      />
    );
    break;
  case 'checkbox':
    field = (
      <FormControlLabel
        control={<Checkbox
          checked={!!localValue}
          onChange={e => setLocalValue(e.target.checked)}
          onBlur={handleBlur}
          disabled={isDisabled}
        />}
        label={info.title || info.label}
        sx={{ mb: 1 }}
      />
    );
    break;
    case 'dropdown': {
      const options = info.options || [];
      field = (
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2">{info.title || info.label}</Typography>
          <Select
            size="small"
            multiple={!!info.allowMultiSelect}
            value={localValue}
            disabled={isDisabled}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            sx={{ minWidth: 200 }}
          >
            {options.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </Box>
      );
      break;
    }
  case 'radioGroup': {
    const options = info.options || [];
    field = (
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" className="mb-1">{info.title || info.label}</Typography>
        <RadioGroup
          row
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          disabled={isDisabled}
          // defaultValue={info.defaultValue}
        >
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
        <Typography variant="subtitle2" className="mb-1">{info.title || info.label}</Typography>
        {Array.isArray(info.children) && (
            <MemoizedInputBuilderForm
              order={info.children.map(child => child.id)}
              blocks={Object.fromEntries(info.children.map(child => [child.id, { info: child }]))}
              level={level + 1}
              indexPath={[...(indexPath||[]), index]}
              idPath={[...(idPath||[]), info.id]}         
              onDelete={onDelete}
              onReorder={onReorder}
            />
        )}
      </Box>
    );
    break;
  }
  case 'attachment': {
    field = (
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2">{info.title || info.label}</Typography>
        <Button variant="outlined" component="label" size="small" sx={{ mt: 1 }} disabled={isDisabled}>
          Upload File
          <input type="file" hidden accept={(info.accept || []).join(',')} onChange={e => setLocalValue(e.target.files?.[0] || null)} onBlur={handleBlur} />
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
        label={info.title || info.label}
        placeholder={info.placeholder}
        required={info.required}
        multiline
        minRows={info.rows || 3}
        inputProps={{ maxLength: info.maxLength || undefined }}
        // defaultValue={info.defaultValue}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isDisabled}
        sx={{ mb: 1, minWidth: 200 }}
      />
    );
    break;
  }
  case 'date': {
    // Requires @mui/x-date-pickers
    field = (
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2">{info.title || info.label}</Typography>
        <DatePicker
          value={localValue}
          onChange={val => setLocalValue(val)}
          onBlur={handleBlur}
          slotProps={{ textField: { size: 'small', required: info.required, sx: { minWidth: 200 }, disabled: isDisabled } }}
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
        label={info.title || info.label}
        placeholder={info.placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isDisabled}
        sx={{ mb: 1, minWidth: 200 }}
      />
    );
}
  return (
    <div ref={setNodeRef} style={styleWrapper}>
      <Box sx={{ display:'flex', alignItems:'stretch' }}>
      <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'grab', mr:1 }} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" color='action'/>
      </Box>
      <Card variant="outlined" sx={{ mb: 2, background: level === 0 ? '#f5f7fa' : '#f8fafc' }}>
        <CardContent sx={{pb: '8px!important', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box>
            {field}
            {Array.isArray(childarr) && childarr.length > 0 && (
            <MemoizedInputBuilderForm
              order={childarr}
              blocks={childblocks}
              level={level + 1}
              indexPath={[...(indexPath||[]), index]}
              idPath={myIdPath}
              onDelete={onDelete}
              onReorder={onReorder}
            />
          )}
        </Box>
        <Tooltip title="Delete">
          <span>
            <IconButton size="small" color="error" onClick={() => onDelete(myIdPath)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        </CardContent>
      </Card>
      </Box>
    </div>
  );
}

const MemoizedInputBuilderBlock = React.memo(InputBuilderBlock, (prev, next) => {
  return (
    prev.blockId === next.blockId &&
    isEqual(prev.block, next.block) &&
    prev.index === next.index &&   
    prev.level === next.level &&
    isEqual(prev.indexPath, next.indexPath)
  );
});
function InputBuilderForm({ order, blocks, level = 0, indexPath = [], idPath = [], onDelete, onReorder }) {
  const [localOrder, setLocalOrder] = useState(order);
  useEffect(() => {
    setLocalOrder(order);
  }, [order]);
  const memoizedOrder = useMemo(() => localOrder, [localOrder]);
  const memoizedBlocks = useMemo(() => blocks, [blocks]);
  if (!memoizedOrder || !memoizedBlocks) return null;
  
  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = memoizedOrder.indexOf(active.id);
    const newIdx = memoizedOrder.indexOf(over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    setLocalOrder(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(oldIdx, 1);
      updated.splice(newIdx, 0, moved);
      return updated;
    });
    onReorder && onReorder(idPath, memoizedOrder, active.id, over.id);
  }, [memoizedOrder, onReorder]);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={memoizedOrder} strategy={verticalListSortingStrategy}>
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
                level={level}
                indexPath={indexPath}
                idPath={idPath}
                onReorder={onReorder}
                onDelete={onDelete}
              />
            );
          })}
        </Box>
      </SortableContext>
    </DndContext>
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
