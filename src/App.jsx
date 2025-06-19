import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BlockOrderPage from './pages/BlockOrderPage.jsx';
// testing cmd

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlockOrderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
