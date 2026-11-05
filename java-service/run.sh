#!/bin/sh
set -e

cd "$(dirname "$0")"

if [ ! -f "target/classes/com/airport/integration/JavaServiceApplication.class" ]; then
    echo "Compiling Java service..."
    ./build.sh
fi

echo "Starting Java OOP Service on port 5050..."
exec java -cp "target/classes" com.airport.integration.JavaServiceApplication
