import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ActionConfigPage from './pages/ActionConfigPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ActionConfigPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
