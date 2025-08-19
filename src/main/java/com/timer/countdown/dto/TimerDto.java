package com.timer.countdown.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimerDto {
    private String id;
    private Instant targetTime;
    private Instant serverTime;
    private boolean isOwner;
    private List<TimestampDto> timestamps;
}
