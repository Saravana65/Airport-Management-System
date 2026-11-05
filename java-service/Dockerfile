# ==============================================================================
# Phase 10: Java 17 OOP Domain Microservice Multi-Stage Dockerfile
# Stage 1: Compile Java 17 source code and execute unit test suite
# Stage 2: Minimal Eclipse Temurin 17 JRE Alpine runtime with non-root security
# ==============================================================================

# --- Stage 1: Build & Test Environment ---
FROM eclipse-temurin:17-jdk-alpine AS builder-java

WORKDIR /app

# Copy source tree
COPY java-service/src ./src

# Create build target directories
RUN mkdir -p target/classes target/test-classes

# Compile main and test sources using pure OpenJDK standard tools (zero heavy build tool dependencies)
RUN find src/main/java -name "*.java" > sources_main.txt && \
    javac -d target/classes @sources_main.txt && \
    rm sources_main.txt && \
    find src/test/java -name "*.java" > sources_test.txt && \
    javac -cp target/classes -d target/test-classes @sources_test.txt && \
    rm sources_test.txt

# Run comprehensive Java OOP and workflow test suite during container build
RUN java -cp "target/classes:target/test-classes" com.airport.BookingWorkflowTest

# --- Stage 2: Production JRE Runtime ---
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="Saravana <Saravanasrinivas422@gmail.com>"
LABEL description="Airport Management System - Java 17 OOP Domain Microservice"

WORKDIR /app

RUN apk add --no-cache curl

# Security: Create non-root system group and user
RUN addgroup -S airport && adduser -S airport -G airport

# Copy compiled classes from build stage
COPY --from=builder-java /app/target/classes ./target/classes

RUN chown -R airport:airport /app

USER airport

EXPOSE 5050

# Container healthcheck testing /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/health || exit 1

CMD ["java", "-cp", "target/classes", "com.airport.integration.JavaServiceApplication"]
