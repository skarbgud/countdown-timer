-- Oracle 데이터베이스 초기화 스크립트
-- 이 스크립트는 Oracle 컨테이너가 시작된 후 자동으로 실행

-- countdown 사용자 생성
CREATE USER countdown IDENTIFIED BY countdown;

-- 필요한 권한 부여
GRANT CONNECT, RESOURCE TO countdown;
GRANT CREATE SESSION TO countdown;
GRANT CREATE TABLE TO countdown;
GRANT CREATE SEQUENCE TO countdown;
GRANT UNLIMITED TABLESPACE TO countdown;

-- countdown 사용자로 전환
CONN countdown/countdown

-- 테이블 생성
CREATE TABLE timer (
   id VARCHAR2(36) PRIMARY KEY,
   target_time TIMESTAMP,
   owner_session_id VARCHAR2(100)
);

-- 시퀀스 생성
CREATE SEQUENCE timestamp_seq START WITH 1 INCREMENT BY 1;

-- 타임스탬프 테이블 생성
CREATE TABLE timestamps (
   id NUMBER PRIMARY KEY,
   timer_id VARCHAR2(36) NOT NULL,
   captured_at TIMESTAMP,
   remaining_time VARCHAR2(20),
   CONSTRAINT fk_timer FOREIGN KEY (timer_id) REFERENCES timer (id) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_timer_owner ON timer(owner_session_id);
CREATE INDEX idx_timestamps_timer_id ON timestamps(timer_id);
CREATE INDEX idx_timestamps_captured_at ON timestamps(captured_at);

-- 테이블 생성 확인
SELECT table_name FROM user_tables;
SELECT sequence_name FROM user_sequences;
