import React, { useState, useCallback, useEffect } from 'react';
import JsonInputField from '../components/JsonInputField.jsx';
import { MemoizedInputBuilderForm } from '../components/InputBuilderForm.jsx';
import { convertToOrderBlocks, moveItemInNestedArray, removeItemInNestedArray } from '../utils.js';
import { AppBar, Toolbar, Typography, Box, Paper } from '@mui/material';
import { input } from '../inputData.js';
import { useSelector } from 'react-redux';

export default function ConfigurationPage() {
  const [json, setJson] = useState(JSON.stringify(input, null, 2));
  const [inputArr, setInputArr] = useState(input);
  const [error, setError] = useState(null);

  const userResponse = useSelector(state => state.userResponse);
  const [result, setResult] = useState({ order: [], blocks: {} });
  const [loading, setLoading] = useState(false);

  // Recompute blocks whenever inputArr or userResponse changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await convertToOrderBlocks(inputArr, userResponse);
        if (active) setResult(res);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [inputArr, userResponse]);

  console.log("result: ", result);

  const handleJsonChange = useCallback(val => setJson(val), []);
  const handleJsonBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(json);
      setInputArr(parsed);
      setError(null);
    } catch {
      setError('Invalid JSON');
    }
  }, [json]);

  React.useEffect(() => {
    setJson(JSON.stringify(inputArr, null, 2));
  }, [inputArr]);

  const onMove = useCallback((indexPath, direction) => {
    setInputArr(prev => moveItemInNestedArray(prev, indexPath, direction));
  }, []);

  // Remove field at indexPath from inputArr
  const onDelete = useCallback((indexPath) => {
    setInputArr(prev => removeItemInNestedArray(prev, indexPath));
  }, []);

  return (
    <Box>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" color="inherit">Action Name</Typography>
        </Toolbar>
      </AppBar>
      <Box display="flex" gap={4} p={4}>
        <Paper sx={{ width: '50%', p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>Input Field JSON</Typography>
          <JsonInputField value={json} onChange={handleJsonChange} onBlur={handleJsonBlur} error={error} />
        </Paper>
        <Paper sx={{ width: '50%', p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>Form Preview</Typography>
          <MemoizedInputBuilderForm order={result.order} blocks={result.blocks} onMove={onMove} onDelete={onDelete} />
        </Paper>
      </Box>
    </Box>
  );
}
