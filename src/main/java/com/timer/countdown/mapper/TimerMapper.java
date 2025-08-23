package com.timer.countdown.mapper;

import com.timer.countdown.model.Timer;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TimerMapper {
    void insertTimer(Timer timer);
    
    Timer selectTimerById(String id);

    void updateTimer(Timer timer);
}
