import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TimerPage from './pages/TimerPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/timer/:timerId" element={<TimerPage />} />
      </Routes>
    </Router>
  );
}

export default App;