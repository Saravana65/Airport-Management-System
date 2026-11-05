# ==============================================================================
# Phase 10: React Frontend Multi-Stage Dockerfile
# Stage 1: Build React static bundle using Vite
# Stage 2: Serve production assets via high-performance Nginx Alpine web server
# ==============================================================================

# --- Stage 1: Build Environment ---
FROM node:20-alpine AS builder-frontend

WORKDIR /app

# Cache dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Production build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: Production Nginx Server ---
FROM nginx:1.27-alpine

LABEL maintainer="Saravana <Saravanasrinivas422@gmail.com>"
LABEL description="Airport Management System - React.js Presentation Tier"

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA static assets from builder stage
COPY --from=builder-frontend /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check verifies Nginx is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
