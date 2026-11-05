# ==============================================================================
# Phase 10: Node.js Backend & C Engine Multi-Stage Dockerfile
# Stage 1: Compile Native ANSI C99 Algorithm Engine with GCC on Alpine
# Stage 2: Production Node.js 20 Alpine Runtime with Non-Root Security & Dumb-Init
# ==============================================================================

# --- Stage 1: Native C Compiler Stage ---
FROM alpine:3.20 AS builder-c

RUN apk add --no-cache gcc musl-dev make

WORKDIR /c-engine
COPY c-engine/ ./

# Compile native Linux ELF binaries and execute unit tests during build
RUN gcc -O2 -Wall -Wextra -Iinclude -o c-engine src/main.c src/gate_allocation.c src/flight_priority_queue.c src/baggage_routing.c && \
    gcc -O2 -Wall -Wextra -Iinclude -o test_algorithms tests/test_algorithms.c src/gate_allocation.c src/flight_priority_queue.c src/baggage_routing.c && \
    ./test_algorithms

# --- Stage 2: Node.js Production Runtime ---
FROM node:20-alpine

LABEL maintainer="Saravana <Saravanasrinivas422@gmail.com>"
LABEL description="Airport Management System - Node.js Express API Gateway & C Engine"

WORKDIR /app

# Install dumb-init for graceful signal forwarding (SIGTERM/SIGINT) and curl for health checks
RUN apk add --no-cache dumb-init curl

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code
COPY backend/ ./

# Copy compiled native C engine from Stage 1 into /app/c-engine/
COPY --from=builder-c /c-engine/c-engine ./c-engine/c-engine
RUN chmod +x ./c-engine/c-engine

# Security: assign permissions to unprivileged node user
RUN chown -R node:node /app

USER node

EXPOSE 5000

ENV PORT=5000 \
    NODE_ENV=production \
    C_ENGINE_PATH=/app/c-engine/c-engine

# Container healthcheck testing /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
