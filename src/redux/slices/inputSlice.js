import { createSlice } from '@reduxjs/toolkit';
import { input as initialInput } from '../../inputData';

const inputSlice = createSlice({
  name: 'input',
  initialState: initialInput,
  reducers: {
    setInput: (state, action) => action.payload,
    resetInput: () => initialInput,
  },
});

export const { setInput, resetInput } = inputSlice.actions;
export default inputSlice.reducer;
