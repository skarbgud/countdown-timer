package com.timer.countdown.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 타이머 생성 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimerRequestDto {

    /**
     * 기준 시각 (ISO 8601 형식의 UTC 시간)
     * 예: "2025-08-20T18:00:00Z"
     */
    private String targetTime;
}