package com.timer.countdown.exception;

public class TimerNotFoundException extends RuntimeException {
    public TimerNotFoundException(String timerId) {
        super("타이머를 찾을 수 없습니다: " + timerId);
    }
}
