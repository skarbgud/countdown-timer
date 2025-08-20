-- Drop tables if they exist
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

CREATE TABLE timer
(
    id               VARCHAR2(36) PRIMARY KEY,
    target_time      TIMESTAMP NOT NULL,
    owner_session_id VARCHAR2(100) NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE timestamps
(
    id NUMBER DEFAULT timestamp_seq.NEXTVAL PRIMARY KEY,
    timer_id                 VARCHAR2(36) NOT NULL,
    captured_at              TIMESTAMP NOT NULL,
    remaining_time_ms        NUMBER, -- ms 저장
    remaining_time_formatted VARCHAR2(20), -- 포맷시간 문자열저장 (쉼표 추가)
    CONSTRAINT fk_timer FOREIGN KEY (timer_id) REFERENCES timer (id) ON DELETE CASCADE
);