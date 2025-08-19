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
    private String timerId;
    private Instant capturedAt;
    private String remainingTime;
}