package com.timer.countdown.controller;

import com.timer.countdown.dto.TimerDto;
import com.timer.countdown.dto.TimestampDto;
import com.timer.countdown.service.TimerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<TimerDto> createTimer(@RequestBody Map<String, String> payload,
                                               HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        Instant targetTime = Instant.parse(payload.get("targetTime"));
        
        TimerDto timer = timerService.createTimer(targetTime, session.getId());
        return ResponseEntity.ok(timer);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimerDto> getTimer(@PathVariable String id, HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        
        return timerService.getTimer(id, session.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/target-time")
    public ResponseEntity<TimerDto> updateTargetTime(@PathVariable String id,
                                                   @RequestBody Map<String, String> payload,
                                                   HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        Instant newTargetTime = Instant.parse(payload.get("targetTime"));
        
        return timerService.updateTargetTime(id, newTargetTime, session.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }

    @PostMapping("/{id}/timestamps")
    public ResponseEntity<TimestampDto> saveTimestamp(@PathVariable String id,
                                                    @RequestBody Map<String, String> payload) {
        String remainingTime = payload.get("remainingTime");
        
        return timerService.saveTimestamp(id, remainingTime)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
