package com.timer.countdown.service;

import com.timer.countdown.dto.TimerDto;
import com.timer.countdown.dto.TimestampDto;
import com.timer.countdown.exception.PermissionDeniedException;
import com.timer.countdown.exception.TimerNotFoundException;
import com.timer.countdown.mapper.TimerMapper;
import com.timer.countdown.mapper.TimestampMapper;
import com.timer.countdown.model.Timer;
import com.timer.countdown.model.Timestamp;
import com.timer.countdown.websocket.TimerWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimerService {

    private final TimerMapper timerMapper;
    private final TimestampMapper timestampMapper;
    private final TimerWebSocketHandler timerWebSocketHandler;

    /**
     * 새 타이머 생성
     * - 고유한 Timer ID 생성
     * - Owner ID 설정 (세선 ID 사용)
     * - 기본 상태로 DB 저장
     * @param targetTime
     * @param ownerId
     * @return
     */
    @Transactional
    public TimerDto createTimer(Instant targetTime, String ownerId) {
        String timerId = UUID.randomUUID().toString();

        Timer timer = Timer.builder()
                .timerId(timerId)
                .targetTime(targetTime)
                .ownerId(ownerId)
                .isExpired(false)
                .createdAt(Instant.now())
                .build();

        timerMapper.insertTimer(timer);

        log.info("새 타이머 생성: {} (Owner: {})", timerId, ownerId);
        
        return convertToDto(timer, true); //생성자는 항상 Owner
    }

    /**
     * 타이머 조회
     * - Timer ID로 타이머 정보
     * - 요청자 Onwer인지 여부 판단
     * - 타임스탬프 리스트 포함
     * @param timerId 타이머 ID
     * @param sessionId 요청자의 세션 ID
     * @return
     */
    public TimerDto getTimer(String timerId, String sessionId) {
        Timer timer = timerMapper.selectTimerById(timerId);
        if (timer == null || timer.getOwnerId() == null) {
            throw new TimerNotFoundException(timerId);
        }

        // Owner 여부 판단 (세션 ID 비교)
        boolean isOwner = timer.getOwnerId().equals(sessionId);

        log.info("타이머 조회: {} (요청자: {}, Owner 여부: {})", timerId, sessionId, isOwner);

        return convertToDto(timer, isOwner);
    }

    /**
     * 기준 시각 수정 (Owner만 수정가능)
     * @param timerId
     * @param newTargetTime
     * @param sessionId
     * @return
     */
    @Transactional
    public TimerDto updateTargetTime(String timerId, Instant newTargetTime, String sessionId) {
        Timer timer = timerMapper.selectTimerById(timerId);

        if (timer == null) {
            throw new TimerNotFoundException(timerId);
        }

        // Owner의 권한 검증 (null 안전성 추가)
        if (timer.getOwnerId() == null || !timer.getOwnerId().equals(sessionId)) {
            log.warn("타이머 수정 권한 없음: {} (요청자: {}, Owner: {})", timerId, sessionId, timer.getOwnerId());
            throw new PermissionDeniedException();
        }

        // 기준 시간 업데이트
        timer.setTargetTime(newTargetTime);
        timer.setUpdatedAt(Instant.now());

        timerMapper.updateTimer(timer);

        log.info("기준 시각 업데이트: {} -> {}", timerId, newTargetTime);

        // WebSocket을 통해 모든 연결된 클라이언트에게 실시간 알림
        timerWebSocketHandler.broadcastTargetTimeUpdate(timerId, newTargetTime);
        
        return convertToDto(timer, true);
    }

    /**
     * Timer 엔티티를 TimerDto로 변환
     * @param timer
     * @param isOnwer
     * @return
     */
    private TimerDto convertToDto(Timer timer, boolean isOnwer) {
        // 해당 타이머의 타임스탬프들을 조회
        List<Timestamp> timestamps = timestampMapper.selectTimestampsByTimerId(timer.getTimerId());

        return TimerDto.builder()
                .timerId(timer.getTimerId())
                .targetTime(timer.getTargetTime())
                .serverTime(Instant.now()) // 현재 서버 시간
                .isOwner(isOnwer)
                .timestamps(
                        timestamps.stream()
                                .map(ts -> TimestampDto.builder()
                                        .remainingTime(ts.getRemainingTime())
                                        .capturedTime(ts.getCapturedTime())
                                        .build()
                                ).toList())
                .build();
    }

    /**
     * 타임스탬프 저장
     * `남은 시간` 과 `현재 시각` 을 리스트로 적재
     * - 현재 남은 시간과 현재 시각을 저장
     * - 타이머가 만료되어있으면 저장 불가
     * - WebSocket을 통해 모든 클라이언트에게 알림
     * @param timerId
     * @param remainingTime
     * @return
     */
    @Transactional
    public TimestampDto saveTimestamp(String timerId, String remainingTime) {
        Timer timer = timerMapper.selectTimerById(timerId);

        if (timer == null) {
            throw new TimerNotFoundException(timerId);
        }

        // 타이머 만료 체크
        if (timer.isExpired() || Instant.now().isAfter(timer.getTargetTime())) {
            log.warn("만료된 타이머에 타임스탬프 저장 시도:{}", timer);
            throw new IllegalArgumentException("만료된 타이머에는 타임스탬프를 저장할 수 없습니다.");
        }

        Instant currentTime = Instant.now();

        Timestamp timestamp = Timestamp.builder()
                .timerId(timerId)
                .remainingTime(remainingTime)
                .capturedTime(currentTime)
                .createdAt(currentTime)
                .build();

        timestampMapper.insertTimestamp(timestamp);

        log.info("타임스탬프 저장: {} (남은시간: {})", timer, remainingTime);

        // Websocket을 통해 모든 클라이언트에게 새 타임스탬프 알림
        TimestampDto timestampDto = TimestampDto.builder()
                .remainingTime(remainingTime)
                .capturedTime(currentTime)
                .build();

        timerWebSocketHandler.broadcastTimestampAdded(timerId, timestampDto);
        return timestampDto;
    }

    /**
     * 공유 링크 생성
     * @param timerId
     * @return
     */
    public String generateShareUrl(String timerId) {
        String baseUrl = "http://localhost:3000"; // @Value로 주입해서 환경별로 관리해야함
        return baseUrl + "/timer/" + timerId;
    }

}