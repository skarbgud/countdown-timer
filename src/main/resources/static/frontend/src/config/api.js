// 환경에 따른 API 기본 URL 설정
const getApiBaseUrl = () => {
  // 현재 도메인이 localhost가 아니면 (프로덕션 환경) 상대 경로 사용
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ''; // 상대 경로 사용 (같은 도메인)
  }
  // 로컬 개발 환경
  return 'http://localhost:8088';
};

export const API_BASE_URL = getApiBaseUrl();