package com.timer.countdown.mapper;

import com.timer.countdown.model.Timestamp;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface TimestampMapper {
    void insertTimestamp(Timestamp timestamp);
    
    List<Timestamp> selectTimestampsByTimerId(String timerId);
    
    Long selectNextTimestampId();
}
