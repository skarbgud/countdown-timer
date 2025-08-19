import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TimerPage from './pages/TimerPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/timer/:id" element={<TimerPage />} />
      </Routes>
    </div>
  );
}

export default App;
