package com.timer.countdown.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Timestamp {
    private Long id;
    private String timerId;             //연결될 타이머 ID
    private String remainingTime;       //저장 시점의 남은 시간
    private Instant capturedTime;       //저장된 현재 시각
    private Instant createdAt;          //생성 시각
}