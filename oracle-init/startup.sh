#!/bin/bash

# Oracle 데이터베이스가 완전히 시작될 때까지 대기
echo "Oracle 데이터베이스 시작 대기 중..."
while ! sqlplus -s sys/countdown123@//localhost:1521/XE AS SYSDBA <<< "exit" > /dev/null 2>&1; do
    echo "Oracle 데이터베이스 시작 대기 중..."
    sleep 10
done

echo "Oracle 데이터베이스가 시작되었습니다."

# 초기화 스크립트 실행
echo "초기화 스크립트 실행 중..."
sqlplus -s sys/countdown123@//localhost:1521/XE AS SYSDBA @/opt/oracle/scripts/startup/01-init.sql

echo "Oracle 데이터베이스 초기화가 완료되었습니다."
