# Dockerfile
FROM openjdk:17-jdk-slim

# Node.js 설치 (프론트엔드 빌드용)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && node --version \
    && npm --version \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Gradle Wrapper 복사
COPY gradlew .
COPY gradle gradle

# build.gradle과 gradle.properties 복사 (캐시 최적화)
COPY build.gradle .
COPY settings.gradle .
COPY gradle.properties .

# 의존성 다운로드
RUN ./gradlew dependencies --no-daemon

# 프론트엔드 package.json 먼저 복사하여 npm 의존성 설치
COPY src/main/resources/static/frontend/package*.json src/main/resources/static/frontend/
RUN cd src/main/resources/static/frontend && npm install

# 소스 코드 복사
COPY src src

# 애플리케이션 빌드 (프론트엔드 포함)
RUN ./gradlew clean build -x test --no-daemon

# 로그 디렉토리 생성
RUN mkdir -p /app/logs

# 실행용 포트 노출
EXPOSE 8080

# 애플리케이션 실행
CMD ["java", "-jar", "build/libs/countdown-timer.jar"]
