# Stage 1: Build the Next.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build the Next.js application for static export
RUN npm run build

# Stage 2: Build the Go binary
FROM golang:1.24-alpine AS backend-builder

WORKDIR /app

# Copy go.mod and go.sum files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code (excluding frontend)
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY web/ ./web/

# Build the application, disabling CGO to create a static binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o pos-server ./cmd/server

# Stage 3: Create the final, minimal image
FROM alpine:latest

# Install ca-certificates for HTTPS requests (if needed)
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy the static binary from the backend builder stage
COPY --from=backend-builder /app/pos-server .

# Copy the built Next.js frontend from the frontend builder stage
COPY --from=frontend-builder /app/frontend/dist ./web/static

# Copy the original static files as fallback (for API serving)
COPY --from=backend-builder /app/web/static ./web/static-original

# Create data directory for database
RUN mkdir -p /app/data

# The application will create and use 'pos.db' in the data directory
VOLUME /app/data

# Expose port 8081 to the outside world
EXPOSE 8081

# Command to run the application
ENTRYPOINT ["/app/pos-server"]