// 환경에 따른 API 기본 URL 설정
const getApiBaseUrl = () => {
  // 현재 도메인이 localhost가 아니면 (프로덕션 환경) 
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // 빈 문자열을 반환하면 브라우저가 자동으로 현재 도메인을 사용
    // 예: https://countdown-timer-app-cxn7.onrender.com
    return '';
  }
  
  // 로컬 개발 환경
  return 'http://localhost:8088';
};

export const API_BASE_URL = getApiBaseUrl();

// 디버깅용 로그
console.log('현재 도메인:', window.location.hostname);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('전체 API URL 예시:', `${API_BASE_URL}/api/timers/123`);