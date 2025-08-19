package com.timer.countdown.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Timer {
    private String id;
    private Instant targetTime;
    private String ownerSessionId;
    private List<Timestamp> timestamps = new ArrayList<>();
    
    public void generateId() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}