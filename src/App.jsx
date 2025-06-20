import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ActionConfigPage from './pages/ActionConfigPage.jsx'; // Changed import from BlockOrderPage to ActionConfigPage

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ActionConfigPage />} /> {/* Changed rendered component to ActionConfigPage */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;