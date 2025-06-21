import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConfigurationPage from './pages/ConfigurationPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConfigurationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
