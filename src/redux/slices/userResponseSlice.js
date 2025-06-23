import { createSlice } from '@reduxjs/toolkit';

const userResponseSlice = createSlice({
  name: 'userResponse',
  initialState: {},
  reducers: {
    setUserResponse: (state, action) => action.payload,
    updateUserResponse: (state, action) => {
      const { idPath, value } = action.payload;
      function setNested(obj, path, val) {
        if (path.length === 0) return val;
        const [head, ...rest] = path;
        return {
          ...obj,
          [head]: rest.length ? setNested(obj[head] || {}, rest, val) : val,
        };
      }
      return setNested(state, idPath, value);
    },
    resetUserResponse: () => ({}),
  },
});

export const { setUserResponse, updateUserResponse, resetUserResponse } = userResponseSlice.actions;
export default userResponseSlice.reducer;
