import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function HomePage() {
  const [targetTime, setTargetTime] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateTimer = async (e) => {
    e.preventDefault();
    
    if (!targetTime) {
      alert('기준 시각을 선택해주세요');
      return;
    }
    
    try {
      setLoading(true);
      const targetTimeUTC = new Date(targetTime).toISOString();
      const response = await axios.post('/api/timers', {
        targetTime: targetTimeUTC,
      });
      
      navigate(`/timer/${response.data.id}`);
    } catch (error) {
      console.error('Error creating timer:', error);
      alert('타이머 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Set the min datetime to current time
  const now = new Date();
  const nowLocalString = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);

  return (
    <div className="container">
      <h1>카운트다운 타이머</h1>
      
      <form onSubmit={handleCreateTimer}>
        <div className="form-group">
          <label htmlFor="targetTime">기준 시각 (UTC):</label>
          <input
            type="datetime-local"
            id="targetTime"
            value={targetTime}
            min={nowLocalString}
            onChange={(e) => setTargetTime(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? '생성중...' : '카운트다운 타이머 생성'}
        </button>
      </form>
    </div>
  );
}

export default HomePage;