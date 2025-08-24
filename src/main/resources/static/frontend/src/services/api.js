import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API 요청 실패:', error);
    throw error;
  }
);

// 타이머 관련 API
export const timerAPI = {
  // 타이머 생성
  createTimer: (targetTime) => 
    api.post('/api/timers', {
      targetTime: new Date(targetTime).toISOString()
    }),
  
  // 타이머 조회
  getTimer: (timerId) => api.get(`/api/timers/${timerId}`),
  
  // 목표 시간 업데이트
  updateTargetTime: (timerId, targetTime) => 
    api.put(`/api/timers/${timerId}/target-time`, {
      targetTime: new Date(targetTime).toISOString()
    }),
  
  // 타임스탬프 저장
  saveTimestamp: (timerId, remainingTime) => 
    api.post(`/api/timers/${timerId}/timestamps`, {
      remainingTime
    }),
};

export default api;
