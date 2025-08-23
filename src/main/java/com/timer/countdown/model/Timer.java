package com.timer.countdown.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Timer {
    private String timerId;         //타이머의 ID
    private Instant targetTime;     //타이머의 원하는 시간
    private String ownerId;         //타이머의 소유자
    private boolean isExpired;      //만료여부
    private Instant createdAt;      //생성일
    private Instant updatedAt;      //수정일
    @Builder.Default
    private List<Timestamp> timestamps = new ArrayList<>();
}