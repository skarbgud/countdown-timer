# 카운트다운 타이머 애플리케이션

사용자가 기준 시각을 설정하고 해당 시각까지 남은 시간을 실시간으로 표시하고 공유할 수 있는 타이머 시스템입니다. 이 시스템은 공유 링크를 통해 여러 사용자가 같은 기준 시각에 맞춘 타이머를 조회할 수 있으며, 최초 생성자(owner)는 기준 시각을 수정할 수 있습니다.

## 주요 기능

- 기준 시각 설정 및 수정 (소유자만 가능)
- 실시간 카운트다운 표시
- 공유 링크를 통한 타이머 공유
- 카운트다운 중 타임스탬프 저장 기능
- 저장된 타임스탬프 목록 조회
- 기준 시각 수정 시 실시간 업데이트
- 기준 시각 도달 시 알림 표시

## 기술 스택

### 백엔드
- Java 17
- Spring Boot 3.2.0
- Spring WebSocket
- MyBatis
- Oracle Database
- Lombok

### 프론트엔드
- React 18
- React Router v6
- Axios (API 호출)
- SockJS 및 STOMP (웹소켓 통신)

## 프로젝트 구조

```
countdown-timer/
  ├── src/
  │   ├── main/
  │   │   ├── java/
  │   │   │   └── com/timer/countdown/
  │   │   │       ├── config/
  │   │   │       │   ├── WebConfig.java
  │   │   │       │   ├── WebSocketConfig.java
  │   │   │       │   └── MyBatisConfig.java
  │   │   │       ├── controller/
  │   │   │       │   └── TimerController.java
  │   │   │       ├── dto/
  │   │   │       │   ├── TimerDto.java
  │   │   │       │   ├── TimestampDto.java
  │   │   │       │   └── ResponseDto.java
  │   │   │       ├── exception/
  │   │   │       │   ├── GlobalExceptionHandler.java
  │   │   │       │   ├── TimerNotFoundException.java
  │   │   │       │   └── PermissionDeniedException.java
  │   │   │       ├── mapper/
  │   │   │       │   ├── TimerMapper.java
  │   │   │       │   └── TimestampMapper.java
  │   │   │       ├── model/
  │   │   │       │   ├── Timer.java
  │   │   │       │   └── Timestamp.java
  │   │   │       ├── service/
  │   │   │       │   └── TimerService.java
  │   │   │       └── CountdownApplication.java
  │   │   ├── resources/
  │   │   │   ├── mappers/
  │   │   │   │   ├── TimerMapper.xml
  │   │   │   │   └── TimestampMapper.xml
  │   │   │   ├── static/
  │   │   │   │   └── frontend/
  │   │   │   │       ├── public/
  │   │   │   │       └── src/
  │   │   │   │           ├── pages/
  │   │   │   │           │   ├── HomePage.js
  │   │   │   │           │   └── TimerPage.js
  │   │   │   │           ├── App.js
  │   │   │   │           └── index.js
  │   │   │   └── application.yml
  ├── init-scripts/
  │   └── 01-init.sql
  ├── logs/
  ├── docker-compose.yml
  ├── Dockerfile
  ├── start-docker.sh
  └── build.gradle
```

## 🚀 빠른 시작 (Docker 환경)

### 1. 전체 애플리케이션 실행 (권장)

```bash
# 모든 서비스 빌드 및 시작
./start-docker.sh
```

이 명령은 다음을 자동으로 수행합니다:
- 애플리케이션 빌드
- Oracle 데이터베이스 컨테이너 시작
- Spring Boot 애플리케이션 컨테이너 시작

### 2. 수동으로 Docker 실행

```bash
# 애플리케이션 빌드
./gradlew build -x test

# Docker Compose로 서비스 시작
docker-compose up -d

# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f oracle-db
docker-compose logs -f timer-app
```

### 3. 서비스 접속

- **카운트다운 타이머 앱**: http://localhost:8088
- **Oracle Enterprise Manager**: http://localhost:5500
- **Oracle 데이터베이스**: localhost:1521

## 🔧 개발 환경 설정

### 1. 로컬 Oracle 데이터베이스 실행

```bash
# Oracle만 시작 (개발용)
./start-oracle.sh
```

### 2. 백엔드 실행

```bash
# Java 17 이상이 설치되어 있는지 확인
java -version

# 프로젝트 루트 디렉토리에서 실행
./gradlew bootRun
```

애플리케이션은 8088 포트에서 시작됩니다.

### 3. 프론트엔드 실행

```bash
# frontend 디렉토리로 이동
cd src/main/resources/static/frontend

# 종속성 설치
npm install

# 개발 서버 시작
npm start
```

React 앱은 3000 포트에서 시작됩니다.

## 🌍 환경별 설정 (application.yml)

### Local 환경 (기본값)
- **프로파일**: `local`
- **포트**: 8088
- **데이터베이스**: localhost:1521:XE
- **로깅**: DEBUG 레벨
- **커넥션 풀**: 최대 10개

### Docker 환경
- **프로파일**: `docker`
- **포트**: 8080
- **데이터베이스**: oracle-db:1521:TIMERDB
- **로깅**: INFO 레벨, 파일 출력
- **커넥션 풀**: 최대 20개

### Production 환경
- **프로파일**: `prod`
- **포트**: 8080
- **데이터베이스**: prod-db:1521:PRODDB
- **로깅**: WARN 레벨, 파일 출력
- **커넥션 풀**: 최대 15개

## 📊 Docker 서비스 구성

### oracle-db
- **이미지**: gvenzl/oracle-xe:21-slim
- **데이터베이스**: XE
- **사용자**: timer_user
- **포트**: 1521 (DB), 5500 (EM)

### timer-app
- **이미지**: 로컬 빌드
- **포트**: 8088
- **의존성**: oracle-db (health check 완료 후 시작)

## 🗄️ 데이터베이스 스키마

Oracle 데이터베이스에 다음 테이블이 자동으로 생성됩니다:

- `timer`: 타이머 기본 정보 (ID, 기준 시각, 소유자 세션 ID)
- `timestamps`: 저장된 타임스탬프 정보 (ID, 타이머 ID, 캡처 시각, 남은 시간)

## 📝 API 엔드포인트

- `POST /api/timers` - 새 타이머 생성
- `GET /api/timers/{id}` - 타이머 상세 정보 조회
- `PUT /api/timers/{id}/target-time` - 타이머 기준 시각 업데이트 (소유자만 가능)
- `POST /api/timers/{id}/timestamps` - 타임스탬프 저장

## 🔌 웹소켓 토픽

- `/topic/timer/{id}` - 타이머의 기준 시각이 수정될 때 업데이트 수신
- `/topic/timer/{id}/timestamp` - 새 타임스탬프 수신

## 🛠️ 유용한 명령어

```bash
# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart

# 특정 서비스 로그 확인
docker-compose logs -f oracle-db
docker-compose logs -f timer-app

# 컨테이너 내부 접속
docker-compose exec oracle-db sqlplus timer_user/timer_password123@//localhost:1521/XE

# 볼륨 정리 (주의: 모든 데이터 삭제)
docker-compose down -v

# 프로파일 변경으로 실행
SPRING_PROFILES_ACTIVE=docker ./gradlew bootRun
```

## ⚠️ 주의사항

- Oracle Express Edition은 약 2-3GB 디스크 공간 필요
- 첫 시작 시 5-10분 소요될 수 있음
- Docker Desktop 메모리 할당 확인 필요 (최소 2GB)
- 프로덕션 환경에서는 보안 설정 강화 필요

## 🚨 문제 해결

### Oracle 연결 문제
- Docker 컨테이너가 완전히 시작되었는지 확인
- 포트 1521이 올바르게 매핑되었는지 확인
- 초기화 스크립트가 성공적으로 실행되었는지 확인

### 메모리 부족
- Oracle Express Edition은 최소 2GB RAM이 필요합니다
- Docker Desktop의 메모리 할당을 확인하세요

### 빌드 실패
- Java 17 이상이 설치되어 있는지 확인
- Gradle 래퍼가 실행 가능한지 확인

### 프로파일 문제
- `application.yml`에서 올바른 프로파일이 활성화되었는지 확인
- 환경 변수 `SPRING_PROFILES_ACTIVE` 설정 확인