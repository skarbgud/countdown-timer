package com.timer.countdown.controller;

import com.timer.countdown.dto.ResponseDto;
import com.timer.countdown.dto.TimerDto;
import com.timer.countdown.dto.TimestampDto;
import com.timer.countdown.exception.PermissionDeniedException;
import com.timer.countdown.exception.TimerNotFoundException;
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

    @PostMapping
    public ResponseEntity<ResponseDto<TimerDto>> createTimer(@RequestBody Map<String, String> payload,
                                              HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        Instant targetTime = Instant.parse(payload.get("targetTime"));
        
        TimerDto timer = timerService.createTimer(targetTime, session.getId());
        return ResponseEntity.ok(ResponseDto.success(timer, "타이머가 생성되었습니다."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseDto<TimerDto>> getTimer(@PathVariable String id, HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        
        TimerDto timerDto = timerService.getTimer(id, session.getId())
                .orElseThrow(() -> new TimerNotFoundException(id));
                
        return ResponseEntity.ok(ResponseDto.success(timerDto));
    }

    @PutMapping("/{id}/target-time")
    public ResponseEntity<ResponseDto<TimerDto>> updateTargetTime(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        Instant newTargetTime = Instant.parse(payload.get("targetTime"));
        
        TimerDto timerDto = timerService.updateTargetTime(id, newTargetTime, session.getId())
                .orElseThrow(() -> new PermissionDeniedException());
                
        return ResponseEntity.ok(ResponseDto.success(timerDto, "기준 시각이 업데이트되었습니다."));
    }

    @PostMapping("/{id}/timestamps")
    public ResponseEntity<ResponseDto<TimestampDto>> saveTimestamp(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        String remainingTime = payload.get("remainingTime");
        
        TimestampDto timestampDto = timerService.saveTimestamp(id, remainingTime)
                .orElseThrow(() -> new TimerNotFoundException(id));
                
        return ResponseEntity.ok(ResponseDto.success(timestampDto, "타임스탬프가 저장되었습니다."));
    }
}