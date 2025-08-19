package com.timer.countdown;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
@MapperScan("com.timer.countdown.mapper")
public class CountdownApplication {

    public static void main(String[] args) {
        SpringApplication.run(CountdownApplication.class, args);
    }
}