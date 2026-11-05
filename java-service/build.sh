#!/bin/sh
set -e

echo "================================================================="
echo "  Compiling Airport Management System - Java OOP Service (Linux)"
echo "================================================================="

cd "$(dirname "$0")"

mkdir -p target/classes target/test-classes

echo "[1/3] Compiling Main Source Files..."
find src/main/java -name "*.java" > sources_main.txt
javac -d target/classes @sources_main.txt
rm sources_main.txt

echo "[2/3] Compiling Test Source Files..."
find src/test/java -name "*.java" > sources_test.txt
javac -cp "target/classes" -d target/test-classes @sources_test.txt
rm sources_test.txt

echo "[3/3] Executing Java OOP Test Suite..."
java -cp "target/classes:target/test-classes" com.airport.BookingWorkflowTest

echo "================================================================="
echo "  Java OOP Service Linux Build Succeeded!"
echo "================================================================="
