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
  │   │   │       │   └── WebSocketConfig.java
  │   │   │       ├── controller/
  │   │   │       │   └── TimerController.java
  │   │   │       ├── dto/
  │   │   │       │   ├── TimerDto.java
  │   │   │       │   └── TimestampDto.java
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
  │   │   │   ├── application.properties
  │   │   │   ├── schema.sql
  │   │   │   └── db_init.sql
  └── build.gradle
```

## 설정 및 실행 방법

### 데이터베이스 설정

1. Oracle 데이터베이스가 설치되어 있고 실행 중인지 확인
2. SYSTEM 사용자로 데이터베이스에 연결
3. `src/main/resources/db_init.sql` 스크립트를 실행하여 countdown 사용자 생성
4. countdown 사용자로 연결하여 `src/main/resources/schema.sql` 스크립트를 실행하여 테이블 생성

### 백엔드

1. Java 17 이상이 설치되어 있는지 확인
2. 리포지토리 복제
3. 프로젝트 루트 디렉토리로 이동
4. 필요한 경우 `application.properties`에서 Oracle 데이터베이스 연결 정보 업데이트
5. `./gradlew bootRun` 명령으로 Spring Boot 애플리케이션 시작
6. 서버는 8088 포트에서 시작됨

### 프론트엔드

1. Node.js와 npm이 설치되어 있는지 확인
2. `src/main/resources/static/frontend` 디렉토리로 이동
3. `npm install` 명령으로 종속성 설치
4. `npm start` 명령으로 개발 서버 시작
5. React 앱은 3000 포트에서 시작됨

## API 엔드포인트

- `POST /api/timers` - 새 타이머 생성
- `GET /api/timers/{id}` - 타이머 상세 정보 조회
- `PUT /api/timers/{id}/target-time` - 타이머 기준 시각 업데이트 (소유자만 가능)
- `POST /api/timers/{id}/timestamps` - 타임스탬프 저장

## 웹소켓 토픽

- `/topic/timer/{id}` - 타이머의 기준 시각이 수정될 때 업데이트 수신
- `/topic/timer/{id}/timestamp` - 새 타임스탬프 수신

## 프로덕션 빌드

프로덕션용 애플리케이션 빌드 방법:

1. 데이터베이스 설정 섹션에 설명된 대로 Oracle 데이터베이스 설정
2. `src/main/resources/static/frontend`로 이동하여 `npm run build` 실행
3. 프로젝트 루트로 이동하여 `./gradlew build` 실행
4. 패키지된 JAR 파일은 `build/libs` 디렉토리에 있음

## 배포

애플리케이션은 단일 JAR 파일로 배포할 수 있습니다. 다음과 같이 실행하세요:

```
java -jar build/libs/countdown-timer-0.0.1-SNAPSHOT.jar
```

배포 환경에서 Oracle 데이터베이스에 접근할 수 있는지 확인하세요.