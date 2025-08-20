-- init-scripts/01-create-schema.sql
-- Oracle 컨테이너 시작 시 자동으로 실행될 스크립트

BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE timestamps';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE timer';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;
/

BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE timestamp_seq';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -2289 THEN
         RAISE;
      END IF;
END;
/

-- Create sequences
CREATE SEQUENCE timestamp_seq START WITH 1 INCREMENT BY 1;

-- Create Timer table
CREATE TABLE timer
(
    id               VARCHAR2(36) PRIMARY KEY,
    target_time      TIMESTAMP NOT NULL,
    owner_session_id VARCHAR2(100) NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Timestamp table
CREATE TABLE timestamps
(
    id                       NUMBER DEFAULT timestamp_seq.NEXTVAL PRIMARY KEY,
    timer_id                 VARCHAR2(36) NOT NULL,
    captured_at              TIMESTAMP NOT NULL,
    remaining_time_ms        NUMBER,
    remaining_time_formatted VARCHAR2(20),
    CONSTRAINT fk_timer FOREIGN KEY (timer_id) REFERENCES timer (id) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_timer_owner_session ON timer(owner_session_id);
CREATE INDEX idx_timer_target_time ON timer(target_time);
CREATE INDEX idx_timestamps_timer_id ON timestamps(timer_id);
CREATE INDEX idx_timestamps_captured_at ON timestamps(captured_at);

-- 샘플 데이터 (개발용)
INSERT INTO timer (id, target_time, owner_session_id) 
VALUES ('sample-timer-001', TIMESTAMP '2025-12-31 23:59:59', 'sample-session-001');

INSERT INTO timestamps (timer_id, captured_at, remaining_time_ms, remaining_time_formatted)
VALUES ('sample-timer-001', CURRENT_TIMESTAMP, 3600000, '01:00:00');

COMMIT;
