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

-- Create Timer table
CREATE TABLE timer (
   id VARCHAR2(36) PRIMARY KEY,
   target_time TIMESTAMP,
   owner_session_id VARCHAR2(100)
);

-- Create Timestamp table
CREATE TABLE timestamps (
   id NUMBER PRIMARY KEY,
   timer_id VARCHAR2(36) NOT NULL,
   captured_at TIMESTAMP,
   remaining_time VARCHAR2(20),
   CONSTRAINT fk_timer FOREIGN KEY (timer_id) REFERENCES timer (id) ON DELETE CASCADE
);
