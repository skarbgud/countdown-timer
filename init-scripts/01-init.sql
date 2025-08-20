-- MySQL 데이터베이스 초기화 스크립트
-- 카운트다운 타이머 애플리케이션용

-- 데이터베이스 선택
USE timer_db;

-- 기존 테이블 삭제 (존재하는 경우)
DROP TABLE IF EXISTS timestamps;
DROP TABLE IF EXISTS timer;

-- 타이머 테이블 생성
CREATE TABLE timer (
    id VARCHAR(36) PRIMARY KEY,
    target_time TIMESTAMP NOT NULL,
    owner_session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_owner_session (owner_session_id),
    INDEX idx_created_at (created_at)
);

-- 타임스탬프 테이블 생성
CREATE TABLE timestamps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timer_id VARCHAR(36) NOT NULL,
    captured_at TIMESTAMP NOT NULL,
    remaining_time_ms BIGINT NOT NULL,
    remaining_time_formatted VARCHAR(20) NOT NULL,
    FOREIGN KEY (timer_id) REFERENCES timer(id) ON DELETE CASCADE,
    INDEX idx_timer_id (timer_id),
    INDEX idx_captured_at (captured_at)
);

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO timer (id, target_time, owner_session_id, created_at) VALUES 
('sample-timer-1', DATE_ADD(NOW(), INTERVAL 1 HOUR), 'sample-session-1', NOW());

INSERT INTO timestamps (timer_id, captured_at, remaining_time_ms, remaining_time_formatted) VALUES 
('sample-timer-1', DATE_SUB(NOW(), INTERVAL 10 MINUTE), 3600000, '01:00:00'),
('sample-timer-1', DATE_SUB(NOW(), INTERVAL 5 MINUTE), 3300000, '00:55:00');

-- 권한 설정
GRANT ALL PRIVILEGES ON timer_db.* TO 'timer_user'@'%';
FLUSH PRIVILEGES;
