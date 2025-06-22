import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConfigurationPage from './pages/ConfigurationPage.jsx';
import { Provider } from 'react-redux';
import { store } from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ConfigurationPage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
