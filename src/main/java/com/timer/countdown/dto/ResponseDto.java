package com.timer.countdown.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseDto<T> {

    private boolean success;    //성공 여부
    private String message;     //응답 메시지
    private T data;             //응답 데이터
    private String errorCode;   //에러 코드 (실패 시)

    /**
     * 성공 응답 생성
     */
    public static <T> ResponseDto<T> success(T data) {
        return ResponseDto.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    /**
     * 성공 응답 생성 (메시지 포함)
     */
    public static <T> ResponseDto<T> success(T data, String message) {
        return ResponseDto.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * 실패 응답 생성 (메시지만)
     */
    public static <T> ResponseDto<T> failure(String message) {
        return ResponseDto.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}