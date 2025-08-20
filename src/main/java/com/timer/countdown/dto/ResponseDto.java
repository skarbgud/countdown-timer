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
    private String status;
    private String message;
    private T data;

    public static <T> ResponseDto<T> success(T data) {
        return ResponseDto.<T>builder()
                .status("success")
                .data(data)
                .build();
    }

    public static <T> ResponseDto<T> success(T data, String message) {
        return ResponseDto.<T>builder()
                .status("success")
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ResponseDto<T> error(String message) {
        return ResponseDto.<T>builder()
                .status("error")
                .message(message)
                .build();
    }
}
