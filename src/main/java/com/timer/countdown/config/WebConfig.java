package com.timer.countdown.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    /**
     * Local이 아닌 환경에서 공유해서 접속했을때 문제 발생 해결
     * EX)https://countdown-timer-app-cxn7.onrender.com/timer/88f1abfa-68df-4527-8840-440a95c86e2b
     * 로 접속했을때 GET으로 해당 API를 호출하게 되어 500에러 발생
     *
     * 리소스 존재시에는 리소스를 반환하고 아닌 경우에는 index.html로 리다이렉트하도록 한
     * @param registry
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 정적 리소스 핸들러 설정
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        
                        // 요청된 리소스가 존재하면 반환
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        
                        /**
                         API 경로는 제외 (컨트롤러에 /api/timers 매핑되어있음)
                         null을 반환하면 Spring Boot가 다음 핸들러를 찾음
                         /api/timers/{timerId} 같은 API 요청은 TimerController가 처리해야 함
                         만약 여기서 index.html을 반환하면 API 응답이 HTML이 되어버림
                         */
                        if (resourcePath.startsWith("api/")) {
                            return null;
                        }
                        
                        // 그 외 모든 경로는 index.html로 리다이렉트 (SPA 라우팅)
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 루트 경로를 index.html로 리다이렉트
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/timer/**").setViewName("forward:/index.html");
    }
}
