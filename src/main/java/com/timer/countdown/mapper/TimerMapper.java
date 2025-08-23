package com.timer.countdown.mapper;

import com.timer.countdown.model.Timer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TimerMapper {
    void insertTimer(Timer timer);

    Timer selectTimerById(@Param("timer") String timerId);

    void updateTimer(Timer timer);
}
