#!/bin/sh
set -e

echo "================================================================"
echo "  Compiling Airport Management System - C Algorithm Engine (Linux)"
echo "================================================================"

CC=${CC:-gcc}
CFLAGS="-O2 -Wall -Wextra -Iinclude"

cd "$(dirname "$0")"

echo "[1/2] Compiling c-engine CLI harness..."
$CC $CFLAGS -o c-engine src/main.c src/gate_allocation.c src/flight_priority_queue.c src/baggage_routing.c

echo "[2/2] Compiling test_algorithms..."
$CC $CFLAGS -o test_algorithms tests/test_algorithms.c src/gate_allocation.c src/flight_priority_queue.c src/baggage_routing.c

echo "Running algorithm tests..."
./test_algorithms

echo "================================================================"
echo "  C Module Linux Build Succeeded!"
echo "================================================================"
