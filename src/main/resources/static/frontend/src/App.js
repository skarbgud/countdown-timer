import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import HomePage from './pages/HomePage';
import TimerPage from './pages/TimerPage';

// Chakra UI 테마 확장
const theme = extendTheme();

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/timer/:timerId" element={<TimerPage />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;