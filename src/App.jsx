import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import TierPage from './components/TierPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tier/:amount" element={<TierPage />} />
      </Routes>
    </Router>
  );
}

export default App;