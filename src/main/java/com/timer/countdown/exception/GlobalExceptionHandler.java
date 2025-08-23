package com.timer.countdown.exception;

import com.timer.countdown.dto.ResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.format.DateTimeParseException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(TimerNotFoundException.class)
    public ResponseEntity<ResponseDto<Void>> handleTimerNotFoundException(TimerNotFoundException e) {
        logger.error("타이머를 찾을 수 없습니다: {}", e.getMessage());
        return new ResponseEntity<>(ResponseDto.failure(e.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PermissionDeniedException.class)
    public ResponseEntity<ResponseDto<Void>> handlePermissionDeniedException(PermissionDeniedException e) {
        logger.error("권한이 없습니다: {}", e.getMessage());
        return new ResponseEntity<>(ResponseDto.failure(e.getMessage()), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<ResponseDto<Void>> handleDateTimeParseException(DateTimeParseException e) {
        logger.error("날짜/시간 형식이 잘못되었습니다: {}", e.getMessage());
        return new ResponseEntity<>(ResponseDto.failure("유효한 날짜/시간 형식이 아닙니다."), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDto<Void>> handleGenericException(Exception e) {
        logger.error("예상치 못한 오류 발생: {}", e.getMessage(), e);
        return new ResponseEntity<>(ResponseDto.failure("서버에서 오류가 발생했습니다."), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
