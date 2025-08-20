#!/bin/bash

echo "🚀 Docker 환경에서 카운트다운 타이머 애플리케이션 시작 중..."

# 애플리케이션 빌드
echo "📦 애플리케이션 빌드 중..."
./gradlew build -x test

if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패! 스크립트를 중단합니다."
    exit 1
fi

echo "✅ 빌드 완료!"

# Docker Compose로 전체 서비스 시작
echo "🐳 Docker Compose로 서비스 시작 중..."
docker-compose up -d

echo "⏳ 서비스 시작 대기 중..."
echo "   (Oracle 데이터베이스는 첫 시작 시 약 5-10분 소요될 수 있습니다)"

# 서비스 상태 확인
echo "📊 서비스 상태:"
docker-compose ps

echo ""
echo "📝 로그 확인:"
echo "   Oracle DB: docker-compose logs -f oracle-db"
echo "   Spring App: docker-compose logs -f timer-app"
echo ""
echo "🛑 중지: docker-compose down"
echo "🔄 재시작: docker-compose restart"
echo ""
echo "💡 애플리케이션이 http://localhost:8088 에서 실행됩니다."
echo "   Oracle Enterprise Manager: http://localhost:5500"
