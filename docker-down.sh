#!/bin/sh
set -e

echo "================================================================"
echo "  Stopping Airport Management System Containers"
echo "================================================================"

cd "$(dirname "$0")"

docker-compose down

echo ""
echo "================================================================"
echo "  Containers Stopped and Network Removed Cleanly."
echo "================================================================"
