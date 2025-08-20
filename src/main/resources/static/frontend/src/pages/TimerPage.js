import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function TimerPage() {
  const { id } = useParams();
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [newTargetTime, setNewTargetTime] = useState('');
  const [timestamps, setTimestamps] = useState([]);
  const [isExpired, setIsExpired] = useState(false);
  
  // References
  const timerInterval = useRef(null);
  const alertShown = useRef(false);
  
  // Calculate offset between client time and server time
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  
  // Format time function
  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00:00';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Function to format ISO date to readable format
  const formatISODate = (isoString) => {
    const date = new Date(isoString);
    return date.toISOString();
  };
  
  // Load timer data from the server
  const loadTimer = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/timers/${id}`);
      
      // Calculate time offset between server and client
      const serverTime = new Date(response.data.serverTime).getTime();
      const clientTime = new Date().getTime();
      const offset = serverTime - clientTime;
      setServerTimeOffset(offset);
      
      setTimer(response.data);
      
      // Sort timestamps by capturedAt in ascending order
      const sortedTimestamps = (response.data.timestamps || []).sort(
        (a, b) => new Date(a.capturedAt) - new Date(b.capturedAt)
      );
      setTimestamps(sortedTimestamps);
      
      // Set the new target time input with the current value
      const targetDate = new Date(response.data.targetTime);
      const localTargetTime = new Date(
        targetDate.getTime() - targetDate.getTimezoneOffset() * 60000
      ).toISOString().slice(0, 16);
      
      setNewTargetTime(localTargetTime);
      
      // Check if timer has already expired
      const targetTime = new Date(response.data.targetTime).getTime();
      const adjustedClientTime = clientTime + offset;
      if (targetTime <= adjustedClientTime) {
        setIsExpired(true);
        setRemainingTime('00:00:00');
        if (!alertShown.current) {
          setTimeout(() => {
            alert('기준 시각에 도달했습니다!');
            alertShown.current = true;
          }, 500);
        }
      } else {
        alertShown.current = false;
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading timer:', err);
      setError('타이머 로딩에 실패했습니다. 나중에 다시 시도해주세요.');
      setLoading(false);
    }
  };
  
  // Update target time function
  const handleUpdateTargetTime = async () => {
    try {
      if (!newTargetTime) {
        alert('유효한 기준 시각을 선택해주세요');
        return;
      }
      
      const targetTimeUTC = new Date(newTargetTime).toISOString();
      
      await axios.put(`/api/timers/${id}/target-time`, {
        targetTime: targetTimeUTC,
      });
      
      setEditMode(false);
      loadTimer(); // Reload timer with updated data
    } catch (err) {
      console.error('Error updating target time:', err);
      alert('기준 시각 업데이트에 실패했습니다. 타이머의 소유자가 아닐 수 있습니다.');
    }
  };
  
  // Save timestamp function
  const handleSaveTimestamp = async () => {
    if (isExpired) return; // 만료된 타이머에는 타임스탬프를 저장하지 않음
    
    try {
      await axios.post(`/api/timers/${id}/timestamps`, {
        remainingTime,
      });
      
      // The timestamp will be added via WebSocket
    } catch (err) {
      console.error('Error saving timestamp:', err);
      alert('타임스탬프 저장에 실패했습니다');
    }
  };
  
  // Generate and copy share link
  const handleShareLink = () => {
    const shareLink = window.location.href;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert('공유 링크가 클립보드에 복사되었습니다!');
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        alert('공유 링크: ' + shareLink);
      });
  };
  
  // Connect to WebSocket - 서버 리소스 절약을 위해 최적화된 방식 사용
  useEffect(() => {
    if (!id) return;
    
    loadTimer();
    
    // Cleanup function
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [id]);
  
  // Set up timer update interval - 클라이언트 측에서 실시간 카운트다운 처리
  useEffect(() => {
    if (!timer) return;
    
    const updateRemainingTime = () => {
      const targetTime = new Date(timer.targetTime).getTime();
      const now = new Date().getTime() + serverTimeOffset;
      
      // Calculate difference in seconds
      const diff = Math.floor((targetTime - now) / 1000);
      
      if (diff <= 0) {
        setRemainingTime('00:00:00');
        
        if (!isExpired) {
          setIsExpired(true);
          clearInterval(timerInterval.current);
          
          // Show alert when timer expires (only once)
          if (!alertShown.current) {
            alert('기준 시각에 도달했습니다!');
            alertShown.current = true;
          }
        }
        
        return;
      }
      
      setRemainingTime(formatTime(diff));
      setCurrentTime(new Date(now).toISOString());
    };
    
    // Update immediately
    updateRemainingTime();
    
    // Then update every second
    timerInterval.current = setInterval(updateRemainingTime, 1000);
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [timer, serverTimeOffset, isExpired]);
  
  // Set the min datetime to current time for the update form
  const now = new Date();
  const nowLocalString = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);
  
  if (loading) return <div className="container">타이머 로딩중...</div>;
  if (error) return <div className="container">{error}</div>;
  if (!timer) return <div className="container">타이머를 찾을 수 없습니다</div>;
  
  return (
    <div className="container">
      <h1>카운트다운 타이머</h1>
      
      {/* 화면 예시에 맞게 디자인 변경 */}
      <div className="timer-box">
        <div className="info-row">
          <span>기준 시각: {formatISODate(timer.targetTime)} </span>
          {timer.isOwner && !isExpired && (
            <button onClick={() => setEditMode(true)} className="secondary">
              [ 기준 시각 수정 ]
            </button>
          )}
        </div>
        
        <div className="info-row">
          <span>현재 시간: {currentTime} (UTC+0)</span>
        </div>
        
        <div className="timer-display">
          남은 시간: ⏳ {remainingTime}
        </div>
        
        {editMode && (
          <div className="edit-form">
            <input
              type="datetime-local"
              value={newTargetTime}
              min={nowLocalString}
              onChange={(e) => setNewTargetTime(e.target.value)}
            />
            <button onClick={handleUpdateTargetTime} disabled={isExpired}>
              저장
            </button>
            <button onClick={() => setEditMode(false)}>취소</button>
          </div>
        )}
      </div>
      
      <div className="controls">
        <button onClick={handleSaveTimestamp} disabled={isExpired}>
          [ timestamp 저장 ]
        </button>
        <button onClick={handleShareLink} className="secondary">
          [ 공유 링크 생성 ]
        </button>
      </div>
      
      <div className="timestamp-list">
        <h3>저장된 Timestamp 리스트:</h3>
        {timestamps.length === 0 ? (
          <p>저장된 타임스탬프가 없습니다</p>
        ) : (
          timestamps.map((ts) => (
            <div className="timestamp-item" key={ts.id}>
              ⏳ {ts.remainingTime} ({formatISODate(ts.capturedAt)})
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TimerPage;