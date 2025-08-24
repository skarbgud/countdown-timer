# 카운트다운 타이머 애플리케이션

사용자가 기준 시각을 설정하고 해당 시각까지 남은 시간을 실시간으로 표시하고 공유할 수 있는 타이머 시스템입니다.<br>
이 시스템은 공유 링크를 통해 여러 사용자가 같은 기준 시각에 맞춘 타이머를 조회할 수 있으며, 최초 생성자(owner)는 기준 시각을 수정할 수 있습니다.
--------------

## 필수 기능
- 기준 시각 설정 및 수정 (소유자만 가능)
- 실시간 카운트다운 표시 (서버의 목표시간과 현재시각 내려주고 남은 시간을 계산하여 표시)
- 공유 링크를 통한 타이머 공유 (URL복사하여 공유하도록 하였음)
- 카운트다운 중 타임스탬프 저장 기능 (타이머가 진행중일때 타이머 저장 버튼을 통해 새로고침후에도 유지되어야 함)
- 저장된 타임스탬프 목록 조회 (모든 사용자들에게도 동일한 타임스탬프를 제공)
- 기준 시각 도달 시 알림 표시 (모든 접속자에게 알림 표시, 타임스탬프 비활성화, 기준시간수정 비활성화)


## 기술 스택

### 백엔드
- Java 17
- Spring Boot 3.2.1
- Spring WebSocket
- MyBatis
- PostgreSQL Database

### 프론트엔드
- React 18
- React Router v6
- Axios (API 호출)
- SockJS (웹소켓 통신)


## 시작 (Docker 환경)

### 1. 전체 애플리케이션 실행

```bash
# 모든 서비스 빌드 및 시작
./start-docker.sh
```

### 2. 수동으로 Docker 실행

```bash
# 애플리케이션 빌드
./gradlew build -x test

# Docker Compose로 서비스 시작
docker-compose up -d
```

## 시작 (local 환경)
### 1. 로컬 PostgreSQL 데이터베이스 실행

```bash
# PostgreSQL만 시작 (개발용)
docker-compose up -d postgres-db
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



### 4. 서비스 접속

- **로컬 카운트다운 타이머 앱**: http://localhost:3000
- **배포되어 있는 카운트다운 타이머 앱**: https://countdown-timer-app-cxn7.onrender.com/


## 데이터베이스 스키마

PostgreSQL 데이터베이스에 다음 테이블이 자동으로 생성됩니다:

- `timer`: 타이머 기본 정보 (ID, 기준 시각, 소유자 세션 ID)
- `timestamps`: 저장된 타임스탬프 정보 (ID, 타이머 ID, 캡처 시각, 남은 시간)

##  API 엔드포인트

### REST API
- `POST /api/timers` - 새 타이머 생성
- `GET /api/timers/{timerId}` - 타이머 상세 정보 조회
- `PUT /api/timers/{timerId}/target-time` - 타이머 기준 시각 업데이트 (소유자만 가능)
- `POST /api/timers/{timerId}/timestamps` - 타임스탬프 저장

### WebSocket API
- `WS /ws` - 실시간 통신을 위한 WebSocket 연결
  - **연결**: 클라이언트가 `/ws` 엔드포인트로 WebSocket 연결
  - **메시지 타입**:
    - `join`: 타이머 방 참가
    - `leave`: 타이머 방 나가기
    - `ping`: 연결 상태 확인

### API 응답 형식
```json
{
  "success": true,
  "message": "성공 메시지",
  "data": {
    // 실제 데이터
  }
}
```

### WebSocket 메시지 형식
```json
// 클라이언트 → 서버
{
  "type": "join",
  "timerId": "uuid-string"
}

// 서버 → 클라이언트
{
  "type": "targetTimeUpdated",
  "timerId": "uuid-string",
  "targetTime": "2024-01-01T12:00:00Z",
  "serverTime": "2024-01-01T10:00:00Z",
  "remainingSeconds": 7200,
  "isExpired": false
}
```


## 실행 문제 발생시
### - PostgreSQL 연결 문제
- Docker 컨테이너가 완전히 시작되었는지 확인
- 포트 5432가 올바르게 매핑되었는지 확인
- 초기화 스크립트가 성공적으로 실행되었는지 확인

### - 메모리 부족
- PostgreSQL은 최소 1GB RAM이 필요합니다
- Docker Desktop의 메모리 할당을 확인

### - 빌드 실패
- Java 17 이상이 설치되어 있는지 확인
- Gradle 래퍼가 실행 가능한지 확인

### - 프로파일 문제
- `application.yml`에서 올바른 프로파일이 활성화되었는지 확인
- 환경 변수 `SPRING_PROFILES_ACTIVE` 설정 확인