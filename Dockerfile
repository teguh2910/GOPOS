# Stage 1: Build the Go binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the application, disabling CGO to create a static binary
# The output is named 'pos-server'
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o pos-server ./cmd/server

# Stage 2: Create the final, minimal image
FROM scratch

WORKDIR /app

# Copy the static binary from the builder stage
COPY --from=builder /app/pos-server .

# Copy the static frontend assets
COPY web/static ./web/static

# The application will create and use 'pos.db' in the working directory.
# It's recommended to mount a volume here to persist the database.
# e.g., docker run -v /path/to/data:/app/data ...
# We will expose a /data volume for the database file.
VOLUME /app/data

# Expose port 8081 to the outside world
EXPOSE 8081

# Command to run the application
ENTRYPOINT ["/app/pos-server"]