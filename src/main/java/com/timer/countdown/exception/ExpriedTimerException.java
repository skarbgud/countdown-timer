package com.timer.countdown.exception;

import com.timer.countdown.model.Timer;

public class ExpriedTimerException extends RuntimeException {
    public ExpriedTimerException(Timer timer) {
        super("만료된 타이머에 타임스탬프 저장 timerId: " + timer.getTimerId());
    }
}
