import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const TimerPage = () => {
  const { timerId } = useParams();
  const [timer, setTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [newTargetTime, setNewTargetTime] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // 타이머 로드 함수를 useCallback으로 메모이제이션
  const loadTimer = useCallback(async () => {
    try {
      console.log('타이머 로드:', `${API_BASE_URL}/api/timers/${timerId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/timers/${timerId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('타이머 데이터:', result);
      
      if (result.success) {
        setTimer(result.data);
      } else {
        alert('타이머 로드 실패: ' + result.message);
      }
    } catch (error) {
      console.error('타이머 로드 실패:', error);
      alert('타이머를 찾을 수 없습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [timerId]);

  // WebSocket 연결 함수를 useCallback으로 메모이제이션
  const connectWebSocket = useCallback(() => {
    try {
      // 기존 연결이 있다면 먼저 정리
      if (wsRef.current) {
        console.log('기존 WebSocket 연결 정리 중...');
        wsRef.current.close();
      }

      console.log('WebSocket 연결 시도: ws://localhost:8088/ws');
      console.log('현재 타이머 ID:', timerId);
      
      wsRef.current = new WebSocket('ws://localhost:8088/ws');
      
      // 연결 상태 모니터링
      console.log('WebSocket readyState:', wsRef.current.readyState);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket 연결됨 - readyState:', wsRef.current.readyState);
        // 연결 성공 시 재연결 시도 횟수 리셋
        reconnectAttemptsRef.current = 0;
        
        const joinMessage = {
          type: 'join',
          timerId: timerId
        };
        console.log('타이머 방 참가 메시지 전송:', joinMessage);
        
        wsRef.current.send(JSON.stringify(joinMessage));
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket 메시지 수신:', message);
        
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

      wsRef.current.onerror = (error) => {
        console.error('WebSocket 오류 발생:', error);
        console.error('WebSocket readyState:', wsRef.current.readyState);
        console.error('WebSocket URL:', wsRef.current.url);
        
        // WebSocket 오류 시 재연결 시도 (최대 시도 횟수 제한)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        } else {
          console.error('WebSocket 최대 재연결 시도 횟수 초과');
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket 연결 종료:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // 정상적인 종료가 아닌 경우 재연결 시도 (최대 시도 횟수 제한)
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('WebSocket 연결 생성 실패:', error);
      // 연결 실패 시 재시도 (최대 시도 횟수 제한)
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      } else {
        console.error('WebSocket 최대 재연결 시도 횟수 초과');
      }
    }
  }, [timerId, loadTimer]);

  // 타이머 로드와 WebSocket 연결
  useEffect(() => {
    loadTimer();
    
    // WebSocket 연결을 약간 지연시켜 백엔드가 완전히 준비되도록 함
    const wsTimer = setTimeout(() => {
      connectWebSocket();
    }, 1000);
    
    return () => {
      clearTimeout(wsTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [loadTimer, connectWebSocket]);

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

  if (loading) return <div>로딩 중...</div>;
  if (!timer) return <div>타이머를 찾을 수 없습니다.</div>;

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