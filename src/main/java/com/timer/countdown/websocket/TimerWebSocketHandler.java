package com.timer.countdown.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timer.countdown.dto.TimestampDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@Slf4j
@RequiredArgsConstructor
public class TimerWebSocketHandler implements WebSocketHandler {

    private final ObjectMapper objectMapper;

    // 타이머 ID별로 연결된 세션들을 관리 (Room 개념)
    private final Map<String, CopyOnWriteArraySet<WebSocketSession>> timerRooms = new ConcurrentHashMap<>();

    // 세션별 타이머 ID 매핑 (연결 해제 시 정리용)
    private final Map<WebSocketSession, String> sessionTimerMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket 연결 성립: {}", session.getId());

        sendMessage(session, Map.of(
                "type", "connected",
                "message", "WebSocket 연결이 성립되었습니다",
                "seesionId", session.getId()
        ));
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        String payload = message.getPayload().toString();
        log.info("WebSocket 메시지 수신: {} from {}", payload, session.getId());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> messageData = objectMapper.readValue(payload, Map.class);
            String type = (String) messageData.get("type");

            switch (type) {
                case "join" -> handleJoinTimer(session, messageData);
                case "leave" -> handleLeaveTimer(session, messageData);
                case "ping" -> handlePing(session);
                default -> log.warn("알 수 없는 메시지 타입: {}", type);
            }

        } catch (Exception e) {
            log.error("메시지 처리 중 오류 발생: ", e);
            sendMessage(session, Map.of(
                    "type", "error",
                    "message", "메시지 처리 중 오류가 발생했습니다."
            ));
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket 전송 오류: {} - {}", session.getId(), exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        log.info("WebSocket 연결 종료: {} - {}", session.getId(), closeStatus);

        // 연결 종료 시 모든 방에서 제거
        String timerId = sessionTimerMap.remove(session);
        if (timerId != null) {
            removeFromTimerRoom(timerId, session);
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    /**
     * 타이머 방 참가 처리
     */
    private void handleJoinTimer(WebSocketSession session, Map<String, Object> messageData) {
        String timerId = (String) messageData.get("timerId");

        if (timerId == null || timerId.isEmpty()) {
            sendMessage(session, Map.of(
                    "type", "error",
                    "message", "타이머 ID가 필요합니다."
            ));
            return;
        }

        // 기존에 다른 방에 있었다면 먼저 나가기
        String currentTimerId = sessionTimerMap.get(session);
        if (currentTimerId != null && !currentTimerId.equals(timerId)) {
            removeFromTimerRoom(currentTimerId, session);
        }

        // 새 방에 참가
        addToTimerRoom(timerId, session);

        log.info("세션 {}이 타이머 방 {}에 참가", session.getId(), timerId);

        sendMessage(session, Map.of(
                "type", "joined",
                "timerId", timerId,
                "message", "타이머 방에 참가했습니다."
        ));
    }

    /**
     * 타이머 방 나가기 처리
     */
    private void handleLeaveTimer(WebSocketSession session, Map<String, Object> messageData) {
        String timerId = sessionTimerMap.get(session);

        if (timerId != null) {
            removeFromTimerRoom(timerId, session);

            sendMessage(session, Map.of(
                    "type", "left",
                    "timerId", timerId,
                    "message", "타이머 방에서 나갔습니다."
            ));
        }
    }

    /**
     * 연결 상태 확인 (Heartbeat)
     */
    private void handlePing(WebSocketSession session) {
        sendMessage(session, Map.of(
                "type", "pong",
                "serverTime", Instant.now().toString()
        ));
    }

    /**
     * 타이머 방에 세션 추가
     */
    private void addToTimerRoom(String timerId, WebSocketSession session) {
        timerRooms.computeIfAbsent(timerId, k -> new CopyOnWriteArraySet<>()).add(session);
        sessionTimerMap.put(session, timerId);

        log.info("타이머 방 {} 현재 연결 수: {}", timerId, timerRooms.get(timerId).size());
    }

    /**
     * 타이머 방에서 세션 제거
     */
    private void removeFromTimerRoom(String timerId, WebSocketSession session) {
        CopyOnWriteArraySet<WebSocketSession> sessions = timerRooms.get(timerId);

        if (sessions != null) {
            sessions.remove(session);

            // 방이 비었으면 제거
            if (sessions.isEmpty()) {
                timerRooms.remove(timerId);
                log.info("빈 타이머 방 {} 제거", timerId);
            } else {
                log.info("타이머 방 {} 현재 연결 수: {}", timerId, sessions.size());
            }
        }

        sessionTimerMap.remove(session);
    }

    /**
     * 기준 시각 변경을 모든 클라이언트에게 브로드캐스트
     * - Service에서 호출됨
     * - 해당 타이머 방의 모든 연결에게 전송
     */
    public void broadcastTargetTimeUpdate(String timerId, Instant newTargetTime) {
        Map<String, Object> message = Map.of(
                "type", "targetTimeUpdated",
                "timerId", timerId,
                "targetTime", newTargetTime.toString(),
                "serverTime", Instant.now().toString()
        );

        broadcastToTimerRoom(timerId, message);

        log.info("기준 시각 변경 브로드캐스트: {} -> {}", timerId, newTargetTime);
    }

    /**
     * 새 타임스탬프 추가를 모든 클라이언트에게 브로드캐스트
     */
    public void broadcastTimestampAdded(String timerId, TimestampDto timestampDto) {
        Map<String, Object> message = Map.of(
                "type", "timestampAdded",
                "timerId", timerId,
                "timestamp", Map.of(
                        "remainingTime", timestampDto.getRemainingTime(),
                        "currentTime", timestampDto.getCurrentTime().toString()
                ),
                "serverTime", Instant.now().toString()
        );

        broadcastToTimerRoom(timerId, message);

        log.info("타임스탬프 추가 브로드캐스트: {} -> {}", timerId, timestampDto.getRemainingTime());
    }

    /**
     * 타이머 만료 알림 브로드캐스트
     */
    public void broadcastTimerExpired(String timerId) {
        Map<String, Object> message = Map.of(
                "type", "timerExpired",
                "timerId", timerId,
                "message", "설정된 시간에 도달했습니다.",
                "serverTime", Instant.now().toString()
        );

        broadcastToTimerRoom(timerId, message);

        log.info("타이머 만료 브로드캐스트: {}", timerId);
    }

    /**
     * 특정 타이머 방의 모든 세션에게 메시지 브로드캐스트
     */
    private void broadcastToTimerRoom(String timerId, Map<String, Object> message) {
        CopyOnWriteArraySet<WebSocketSession> sessions = timerRooms.get(timerId);

        if (sessions == null || sessions.isEmpty()) {
            log.debug("타이머 방 {}에 연결된 세션이 없음", timerId);
            return;
        }

        // 동시성을 위해 복사본 생성
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                sendMessage(session, message);
            } else {
                // 닫힌 세션은 제거
                sessions.remove(session);
                sessionTimerMap.remove(session);
            }
        }

        log.debug("타이머 방 {}에 {} 개 세션에게 브로드캐스트", timerId, sessions.size());
    }

    /**
     * 개별 세션에게 메시지 전송
     */
    private void sendMessage(WebSocketSession session, Map<String, Object> message) {
        try {
            if (session.isOpen()) {
                String jsonMessage = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(jsonMessage));
            }
        } catch (IOException e) {
            log.error("메시지 전송 실패: {} - {}", session.getId(), e.getMessage());
        }
    }
}