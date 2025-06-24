import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, Box, TextField, Checkbox, FormControlLabel, Select, MenuItem, IconButton, Tooltip, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import isEqual from 'lodash.isequal';
import { useDispatch, useSelector } from 'react-redux';

function InputBuilderBlock({ blockId, block, index, orderLength, level, indexPath, idPath, onMove, onDelete }) {
  const dispatch = useDispatch();
  const response = useSelector(state => state.userResponse);
  const { info, childarr, childblocks } = block;
  const depends = info.depends_on || [];
  const isDisabled = depends.length > 0 && depends.some(depId => !response[depId] && response[depId] !== 0 && response[depId] !== false);
  const myIdPath = idPath ? [...idPath, info.id] : [info.id];
  // Helper to get nested value by idPath
  function getNested(obj, path) {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }
  const [localValue, setLocalValue] = useState(info.allowMultiSelect ? [] : '');
  const value = getNested(response, myIdPath);

  useEffect(() => {
    // Sync localValue from Redux value if present, else default
    if (typeof value !== 'undefined') {
      setLocalValue(value);
    } else {
      setLocalValue(info.allowMultiSelect ? [] : '');
    }
    // eslint-disable-next-line
  }, [value, info.allowMultiSelect]);
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
    // Dynamic dropdown support
    let options = info.options || [];
    let loading = false;
    let error = null;
    const [dynamicOptions, setDynamicOptions] = useState([]);
    const [dynamicLoading, setDynamicLoading] = useState(false);
    const [dynamicError, setDynamicError] = useState(null);

    // Helper: safely evaluate dynamicOptions string as async function
    function safeEvalDynamicOptions(fnStr) {
      // eslint-disable-next-line no-new-func
      return Function('userResponse', `return (${fnStr})(userResponse);`);
    }

    // Track last options to clear value if needed
    const prevOptionsRef = React.useRef([]);
    useEffect(() => {
      let active = true;
      if (info.dynamicOptions) {
        setDynamicLoading(true);
        setDynamicError(null);
        setDynamicOptions([]);
        (async () => {
          try {
            const fn = safeEvalDynamicOptions(info.dynamicOptions);
            const result = await fn(response);
            if (active) {
              const newOptions = Array.isArray(result) ? result : [];
              setDynamicOptions(newOptions);
              // Clear value if not present in new options
              const validValues = newOptions.map(o => o.value);
              if (info.allowMultiSelect) {
                if (Array.isArray(localValue) && localValue.some(val => !validValues.includes(val)) && localValue.length > 0) {
                  setLocalValue([]);
                  dispatch({ type: 'userResponse/updateUserResponse', payload: { idPath: myIdPath, value: [] } });
                }
              } else {
                if (localValue && !validValues.includes(localValue)) {
                  setLocalValue('');
                  dispatch({ type: 'userResponse/updateUserResponse', payload: { idPath: myIdPath, value: '' } });
                }
              }
            }
          } catch (err) {
            if (active) {
              setDynamicError('Failed to load options');
              setDynamicOptions([]);
            }
          } finally {
            if (active) setDynamicLoading(false);
          }
        })();
      }
      return () => { active = false; };
      // Re-run when any dependency field value changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, info.dynamicOptions ? (info.optionDependencies || []).map(dep => {
      const depPath = Array.isArray(dep) ? dep : [dep];
      return getNested(response, depPath);
    }) : []);

    if (info.dynamicOptions) {
      options = dynamicOptions;
      loading = dynamicLoading;
      error = dynamicError;
    }

    field = (
      <Select
        size="small"
        displayEmpty
        multiple={!!info.allowMultiSelect}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isDisabled || loading}
        defaultValue={info.allowMultiSelect ? [] : ''}
        sx={{ mb: 1, minWidth: 200 }}
        renderValue={selected => {
          if (loading) return <span className="text-gray-400">Loading...</span>;
          if (error) return <span className="text-red-500">Error</span>;
          if (!selected || (Array.isArray(selected) && selected.length === 0)) {
            return <span className="text-gray-400">{info.title || info.label}</span>;
          }
          if (Array.isArray(selected)) {
            return selected.map(val => options.find(opt => opt.value === val)?.label || val).join(', ');
          }
          return options.find(opt => opt.value === selected)?.label || selected;
        }}
      >
        <MenuItem value="" disabled>{loading ? 'Loading...' : (error ? 'Error' : (info.title || info.label))}</MenuItem>
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
            <MemoizedInputBuilderForm order={childarr} blocks={childblocks} level={level + 1} indexPath={[...(indexPath||[]), index]} idPath={myIdPath} onMove={onMove} onDelete={onDelete} />
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

function InputBuilderForm({ order, blocks, level = 0, indexPath = [], idPath = [], onMove, onDelete }) {
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
                idPath={idPath}
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
