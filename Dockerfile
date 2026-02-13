# Dockerfile for Virtual Conference Translator & Summarizer

# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for audio processing (if needed)
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm ci && npm run build

# Copy source code
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/build/ ./frontend/build/
COPY database/ ./database/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "backend/server.js"]
