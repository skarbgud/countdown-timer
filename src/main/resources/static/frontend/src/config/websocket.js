// 환경에 따른 WebSocket URL 설정
const getWebSocketUrl = () => {
  // 현재 도메인이 localhost가 아니면 (프로덕션 환경) 상대 경로 사용
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
  // 로컬 개발 환경
  return 'ws://localhost:8088/ws';
};

export const WEBSOCKET_URL = getWebSocketUrl();
