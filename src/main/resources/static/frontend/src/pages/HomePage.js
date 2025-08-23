import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [targetTime, setTargetTime] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:8088/api/timers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetTime: new Date(targetTime).toISOString()
      })
    });

    const result = await response.json();
    if (result.success) {
      navigate(`/timer/${result.data.timerId}`);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>타이머 생성</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>기준 시각:</label>
          <input
            type="datetime-local"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <button type="submit">타이머 생성</button>
      </form>
    </div>
  );
};

export default HomePage;