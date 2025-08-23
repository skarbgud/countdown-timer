package com.timer.countdown.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    private String timerId;     //타이머의 ID
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private Instant targetTime;     //기준시각
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private Instant serverTime;     //현재서버시간(시간 동기화용)
    private boolean isOwner;        //현재사용자의 Owner여부(true:기준시각 수정가능, false:조회만 가능)
    private List<TimestampDto> timestamps; //저장된 타임스탬프들의 리스트
}
