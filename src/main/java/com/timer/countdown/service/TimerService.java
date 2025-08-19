package com.timer.countdown.service;

import com.timer.countdown.dto.TimerDto;
import com.timer.countdown.dto.TimestampDto;
import com.timer.countdown.mapper.TimerMapper;
import com.timer.countdown.mapper.TimestampMapper;
import com.timer.countdown.model.Timer;
import com.timer.countdown.model.Timestamp;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimerService {

    private final TimerMapper timerMapper;
    private final TimestampMapper timestampMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public TimerDto createTimer(Instant targetTime, String sessionId) {
        Timer timer = Timer.builder()
                .targetTime(targetTime)
                .ownerSessionId(sessionId)
                .build();
        
        timer.generateId(); // Generate UUID
        timerMapper.insertTimer(timer);
        
        return TimerDto.builder()
                .id(timer.getId())
                .targetTime(timer.getTargetTime())
                .serverTime(Instant.now())
                .isOwner(true)
                .timestamps(List.of())
                .build();
    }

    @Transactional(readOnly = true)
    public Optional<TimerDto> getTimer(String timerId, String sessionId) {
        return timerMapper.selectTimerById(timerId).map(timer -> {
            List<TimestampDto> timestampDtos = timestampMapper.selectTimestampsByTimerId(timerId)
                    .stream()
                    .map(timestamp -> TimestampDto.builder()
                            .id(timestamp.getId())
                            .capturedAt(timestamp.getCapturedAt())
                            .remainingTime(timestamp.getRemainingTime())
                            .build())
                    .collect(Collectors.toList());
            
            return TimerDto.builder()
                    .id(timer.getId())
                    .targetTime(timer.getTargetTime())
                    .serverTime(Instant.now())
                    .isOwner(timer.getOwnerSessionId().equals(sessionId))
                    .timestamps(timestampDtos)
                    .build();
        });
    }

    @Transactional
    public Optional<TimerDto> updateTargetTime(String timerId, Instant newTargetTime, String sessionId) {
        Optional<Timer> timerOpt = timerMapper.selectTimerById(timerId);
        
        return timerOpt.filter(timer -> timer.getOwnerSessionId().equals(sessionId))
                .map(timer -> {
                    timerMapper.updateTargetTime(timerId, newTargetTime);
                    
                    TimerDto timerDto = TimerDto.builder()
                            .id(timer.getId())
                            .targetTime(newTargetTime)
                            .serverTime(Instant.now())
                            .isOwner(true)
                            .build();
                    
                    messagingTemplate.convertAndSend("/topic/timer/" + timerId, timerDto);
                    return timerDto;
                });
    }

    @Transactional
    public Optional<TimestampDto> saveTimestamp(String timerId, String remainingTime) {
        Optional<Timer> timerOpt = timerMapper.selectTimerById(timerId);
        
        return timerOpt.map(timer -> {
            Instant now = Instant.now();
            
            // Get next sequence for timestamp id
            Long nextId = timestampMapper.selectNextTimestampId();
            
            Timestamp timestamp = Timestamp.builder()
                    .id(nextId)
                    .timerId(timerId)
                    .capturedAt(now)
                    .remainingTime(remainingTime)
                    .build();
            
            timestampMapper.insertTimestamp(timestamp);
            
            TimestampDto timestampDto = TimestampDto.builder()
                    .id(timestamp.getId())
                    .capturedAt(timestamp.getCapturedAt())
                    .remainingTime(timestamp.getRemainingTime())
                    .build();
            
            messagingTemplate.convertAndSend("/topic/timer/" + timerId + "/timestamp", timestampDto);
            return timestampDto;
        });
    }
}