# Phase 09/10: C Airport Engine Makefile
# Targets: Linux/macOS and Alpine Docker container environments

CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -Iinclude
SRC = src/main.c src/gate_allocation.c src/flight_priority_queue.c src/baggage_routing.c
TEST_SRC = tests/test_algorithms.c src/gate_allocation.c src/flight_priority_queue.c src/baggage_routing.c
TARGET = c-engine
TEST_TARGET = test_algorithms

all: $(TARGET) $(TEST_TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC)

$(TEST_TARGET): $(TEST_SRC)
	$(CC) $(CFLAGS) -o $(TEST_TARGET) $(TEST_SRC)

test: $(TEST_TARGET)
	./$(TEST_TARGET)

clean:
	rm -f $(TARGET) $(TEST_TARGET) *.o

.PHONY: all test clean
