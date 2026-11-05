#!/bin/sh
set -e

echo "================================================================"
echo "  Starting Airport Management System - Multi-Tier Containers"
echo "================================================================"

cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
    echo "[.env] Creating .env from .env.example..."
    cp .env.example .env
fi

docker-compose up -d --build

echo ""
echo "================================================================"
echo "  Containers Started Successfully!"
echo "================================================================"
echo "  Frontend Web Portal:    http://localhost"
echo "  Node.js API Gateway:    http://localhost:5000/api"
echo "  Health Endpoint:        http://localhost:5000/api/health"
echo "  Java OOP Microservice:  http://localhost:5050/health"
echo "================================================================"
echo "  Run './docker-down.sh' to stop and clean up containers."
echo "================================================================"
