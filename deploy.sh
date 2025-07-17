#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 TgCloud - Deploy Script${NC}"
echo "================================="

LOCAL_IP=$(hostname -I | awk '{print $1}')

if [[ -z "$LOCAL_IP" ]]; then
    echo -e "${RED}⚠️  Failed to detect local IP. Defaulting to localhost.${NC}"
    LOCAL_IP="localhost"
else
    echo -e "${YELLOW}📡 Detected local IP: ${LOCAL_IP}${NC}"
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with:"
    echo "API_ID=your_api_id"
    echo "API_HASH=your_api_hash"
    echo "CHAT_ID=your_chat_id"
    echo "SECRET_KEY=your_secret_key"
    exit 1
fi

echo -e "${YELLOW}🛑 Cleaning up previous containers...${NC}"
docker-compose down --remove-orphans

echo -e "${YELLOW}🐳 Building Docker images...${NC}"
docker-compose build \
    --build-arg VITE_API_BASE_URL="http://${LOCAL_IP}:8000/api/v1" \
    --build-arg VITE_WS_BASE_URL="ws://${LOCAL_IP}:8000"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deploy finished!${NC}"
echo "================================="
echo -e "${GREEN}📱 Access from other devices in your network:${NC}"
echo -e "${GREEN}🌐 Frontend: http://${LOCAL_IP}${NC}"
echo -e "${GREEN}🔧 API Docs: http://${LOCAL_IP}:8000/docs${NC}"
echo "================================="
echo -e "${YELLOW}📋 View logs: docker-compose logs -f${NC}"
echo -e "${YELLOW}🛑 Stop services: docker-compose down${NC}"
