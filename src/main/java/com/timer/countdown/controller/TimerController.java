package com.timer.countdown.controller;

import com.timer.countdown.dto.ResponseDto;
import com.timer.countdown.dto.TimerDto;
import com.timer.countdown.dto.TimerRequestDto;
import com.timer.countdown.dto.TimestampDto;
import com.timer.countdown.dto.TimestampRequestDto;
import com.timer.countdown.service.TimerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/timers")
@RequiredArgsConstructor
public class TimerController {

    private final TimerService timerService;

    /**
     * 타이머 생성 API
     * - 새로운 타이머를 생성하고 해당 사용자를 Owner로 설정
     * - Session ID를 사용해 Owner 권한 관리
     *
     * @param requestDto 타이머 생성 요청 데이터 (targetTime 포함)
     * @param request HTTP 요청 객체 (세션 정보 획득용)
     * @return 생성된 타이머 정보와 Owner 여부
     */
    @PostMapping
    public ResponseEntity<ResponseDto<TimerDto>> createTimer(@RequestBody TimerRequestDto requestDto, HttpServletRequest request) {
        // 세션 생성 (세션이 없으면 새로 생성)
        HttpSession session = request.getSession(true);
        Instant targetTime = Instant.parse(requestDto.getTargetTime());

        // 타이머 생성 시 세션 ID를 Owner ID로 사용
        TimerDto timer = timerService.createTimer(targetTime, session.getId());
        return ResponseEntity.ok(ResponseDto.success(timer, "타이머가 생성되었습니다."));
    }

    /**
     * 타이머 조회 API
     * - 특정 타이머ID로 타이머 정보 조회
     * - Owner 여부에 따라 수정 권한 표시 달라짐
     *
     * @param timerId 조회할 타이머 ID
     * @param request HTTP 요청 객체 (세션을 통한 Owner 여부 확인용)
     * @return 타이머 정보 + 현재 사용자의 Owner 여부
     */
    @GetMapping("/{timerId}")
    public ResponseEntity<ResponseDto<TimerDto>> getTimer(@PathVariable("timerId") String timerId, HttpServletRequest request) {
        // 기존 세션이 있으면 가져오고 없으면 새로 생성
        HttpSession session = request.getSession(true);

        // 타이머 조회 시 세션 ID로 Owner 여부 판단
        TimerDto timerDto = timerService.getTimer(timerId, session.getId());

        return ResponseEntity.ok(ResponseDto.success(timerDto, "타이머 조회가 완료되었습니다."));
    }

    /**
     * 기준 시각 수정 API (Owner만 가능)
     * - Owner만 타이머의 기준 시각을 수정할 수 있음
     * - 수정 시 WebSocket을 통해 모든 연결된 클라이언트에게 실시간 알림
     *
     * @param timerId 수정할 타이머 ID
     * @param payload 새로운 기준 시각 정보
     * @param request HTTP 요청 객체 (Owner 권한 확인용)
     * @return 업데이트된 타이머 정보
     */
    @PutMapping("/{timerId}/target-time")
    public ResponseEntity<ResponseDto<TimerDto>> updateTargetTime(
            @PathVariable("timerId") String timerId,
            @RequestBody Map<String, String> payload,
            HttpServletRequest request
    ) {
        HttpSession session = request.getSession(true);
        Instant newTargetTime = Instant.parse(payload.get("targetTime"));

        TimerDto timerDto = timerService.updateTargetTime(timerId, newTargetTime, session.getId());

        return ResponseEntity.ok(ResponseDto.success(timerDto, "기준 시각이 업데이트되었습니다."));
    }

    /**
     * 타임스탬프 저장 API
     * - 현재 남은 시간과 현재 시각을 타임스탬프로 저장
     * - 타이머가 만료되었으면 저장 불가
     *
     * @param timerId 타임스탬프를 저장할 타이머 ID
     * @param requestDto 저장할 타임스탬프 정보
     * @return 저장된 타임스탬프 정보
     */
    @PostMapping("/{timerId}/timestamps")
    public ResponseEntity<ResponseDto<TimestampDto>> saveTimestamp(
            @PathVariable("timerId") String timerId,
            @RequestBody TimestampRequestDto requestDto
    ) {
        TimestampDto timestampDto = timerService.saveTimestamp(timerId, requestDto.getRemainingTime());

        return ResponseEntity.ok(ResponseDto.success(timestampDto, "타임스탬프가 저장되었습니다."));
    }
}