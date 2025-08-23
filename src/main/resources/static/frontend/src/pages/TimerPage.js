import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const TimerPage = () => {
  const { timerId } = useParams();
  const [timer, setTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [newTargetTime, setNewTargetTime] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const wsRef = useRef(null);

  // 타이머 로드
  useEffect(() => {
    loadTimer();
    connectWebSocket();
    return () => wsRef.current?.close();
  }, [timerId]);

  const loadTimer = async () => {
    const response = await fetch(`http://localhost:8088/api/timers/${timerId}`, {
      credentials: 'include'
    });
    const result = await response.json();
    if (result.success) {
      setTimer(result.data);
    }
  };

  const connectWebSocket = () => {
    wsRef.current = new WebSocket('ws://localhost:8088/ws');

    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        timerId: timerId
      }));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'targetTimeUpdated') {
        setTimer(prev => ({
          ...prev,
          targetTime: message.targetTime
        }));
      } else if (message.type === 'timestampAdded') {
        loadTimer(); // 새로고침
      } else if (message.type === 'timerExpired') {
        alert('시간이 다 되었습니다!');
      }
    };
  };

  // 남은 시간 계산
  useEffect(() => {
    if (!timer) return;

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(timer.targetTime);
      const diff = target - now;

      if (diff <= 0) {
        setRemainingTime('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemainingTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const updateTargetTime = async () => {
    await fetch(`http://localhost:8088/api/timers/${timerId}/target-time`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetTime: new Date(newTargetTime).toISOString()
      })
    });
    setIsEditing(false);
    setNewTargetTime('');
  };

  const saveTimestamp = async () => {
    await fetch(`http://localhost:8088/api/timers/${timerId}/timestamps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        remainingTime: remainingTime
      })
    });
  };

  const generateShareLink = async () => {
    const response = await fetch(`http://localhost:8088/api/timers/${timerId}/share`);
    const result = await response.json();
    if (result.success) {
      const fullUrl = `${window.location.origin}${result.data.shareUrl}`;
      setShareUrl(fullUrl);
      navigator.clipboard.writeText(fullUrl);
      alert('공유 링크가 클립보드에 복사되었습니다.');
    }
  };

  if (!timer) return <div>로딩 중...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <h1>타이머</h1>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>기준 시각: {new Date(timer.targetTime).toLocaleString()}</h2>
        {timer.isOwner && !timer.isExpired && (
          <button onClick={() => setIsEditing(!isEditing)}>
            기준 시각 수정
          </button>
        )}
      </div>

      {isEditing && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <input
            type="datetime-local"
            value={newTargetTime}
            onChange={(e) => setNewTargetTime(e.target.value)}
          />
          <button onClick={updateTargetTime}>수정</button>
          <button onClick={() => setIsEditing(false)}>취소</button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2>현재 시간: {new Date().toLocaleString()}</h2>
        <h1 style={{ fontSize: '48px', color: timer.isExpired ? 'red' : 'blue' }}>
          남은 시간: ⏳ {remainingTime}
        </h1>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={saveTimestamp}
          disabled={timer.isExpired}
          style={{ marginRight: '10px' }}
        >
          timestamp 저장
        </button>
        <button onClick={generateShareLink}>
          공유 링크 생성
        </button>
      </div>

      {shareUrl && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <strong>공유 링크:</strong> {shareUrl}
        </div>
      )}

      <div>
        <h3>저장된 Timestamp 리스트:</h3>
        {timer.timestamps.map((ts, index) => (
          <div key={index} style={{ padding: '5px', borderBottom: '1px solid #ccc' }}>
            ⏳ {ts.remainingTime} ({new Date(ts.capturedTime).toLocaleString()})
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimerPage;