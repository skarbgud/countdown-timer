#!/bin/bash

echo "🚀 Oracle 데이터베이스 시작 중..."

# Docker Compose로 Oracle 시작
docker-compose up -d oracle

echo "⏳ Oracle 컨테이너 시작 대기 중..."
echo "   (첫 시작 시 약 5-10분 소요될 수 있습니다)"

# 컨테이너 상태 확인
echo "📊 컨테이너 상태:"
docker-compose ps

echo ""
echo "📝 로그 확인: docker-compose logs -f oracle"
echo "🛑 중지: docker-compose down"
echo "🔄 재시작: docker-compose restart oracle"
echo ""
echo "💡 Oracle이 완전히 시작되면 애플리케이션을 실행할 수 있습니다."
echo "   java -jar build/libs/countdown-timer-0.0.1-SNAPSHOT.jar"
