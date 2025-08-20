# Dockerfile
FROM openjdk:17-jdk-slim

# 작업 디렉토리 설정
WORKDIR /app

# Gradle Wrapper 복사
COPY gradlew .
COPY gradle gradle

# build.gradle 먼저 복사 (캐시 최적화)
COPY build.gradle .
COPY settings.gradle .

# 의존성 다운로드
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사
COPY src src

# 애플리케이션 빌드
RUN ./gradlew clean build -x test --no-daemon

# 로그 디렉토리 생성
RUN mkdir -p /app/logs

# 실행용 포트 노출
EXPOSE 8080

# 애플리케이션 실행
CMD ["java", "-jar", "build/libs/countdown-timer.jar"]
