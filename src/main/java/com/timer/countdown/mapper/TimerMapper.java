package com.timer.countdown.mapper;

import com.timer.countdown.model.Timer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.Instant;
import java.util.Optional;

@Mapper
public interface TimerMapper {
    void insertTimer(Timer timer);
    
    Optional<Timer> selectTimerById(String id);
    
    void updateTargetTime(@Param("id") String id, @Param("targetTime") Instant targetTime);
}
