package com.timer.countdown.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    /**
     * 헬스체크 엔드포인트
     * - GitHub Actions에서 Render 서버가 활성 상태인지 확인하는 용도
     * - 간단한 상태 정보와 현재 시간을 반환
     *
     * @return 서버 상태 정보
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", Instant.now().toString());
        response.put("service", "Countdown Timer API");
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    /**
     * 루트 경로 핑 엔드포인트
     * - GitHub Actions에서 기본 URL로 핑할 때 사용
     * - 최소한의 응답으로 서버 상태 확인
     *
     * @return 간단한 상태 메시지
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Countdown Timer API is running");
        response.put("status", "OK");
        
        return ResponseEntity.ok(response);
    }
}
