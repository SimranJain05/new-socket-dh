import { configureStore, combineReducers } from '@reduxjs/toolkit';
import inputReducer from './slices/inputSlice';
import userResponseReducer from './slices/userResponseSlice';

const rootReducer = combineReducers({
  input: inputReducer,
  userResponse: userResponseReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});
