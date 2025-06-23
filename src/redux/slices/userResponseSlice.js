import { createSlice } from '@reduxjs/toolkit';

const userResponseSlice = createSlice({
  name: 'userResponse',
  initialState: {},
  reducers: {
    setUserResponse: (state, action) => action.payload,
    updateUserResponse: (state, action) => {
      const { id, value } = action.payload;
      return { ...state, [id]: value };
    },
    resetUserResponse: () => ({}),
  },
});

export const { setUserResponse, updateUserResponse, resetUserResponse } = userResponseSlice.actions;
export default userResponseSlice.reducer;
