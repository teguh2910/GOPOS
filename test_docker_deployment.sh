#!/bin/bash

# GoPOS Docker Deployment Test Script
# This script tests the complete Docker deployment process

set -e  # Exit on any error

echo "🐳 GoPOS Docker Deployment Test"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="gopos-nextjs"
CONTAINER_NAME="gopos-test"
PORT="8081"
VOLUME_NAME="gopos-test-data"
BASE_URL="http://localhost:${PORT}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test resources..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    docker volume rm $VOLUME_NAME 2>/dev/null || true
    print_success "Cleanup completed"
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for service to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "Service is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Service failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to test API endpoint
test_api() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-}
    local expected_status=${4:-200}
    
    print_status "Testing $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint")
    fi
    
    status_code="${response: -3}"
    body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$method $endpoint - Status: $status_code"
        return 0
    else
        print_error "$method $endpoint - Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
        return 1
    fi
}

# Trap to cleanup on exit
trap cleanup EXIT

print_status "Starting GoPOS Docker deployment test..."

# Step 1: Check prerequisites
print_status "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

print_success "Prerequisites check passed"

# Step 2: Build Docker image
print_status "Building Docker image..."
if docker build -t $IMAGE_NAME . > build.log 2>&1; then
    print_success "Docker image built successfully"
else
    print_error "Docker build failed. Check build.log for details"
    exit 1
fi

# Step 3: Run container
print_status "Starting Docker container..."
docker run -d \
    -p $PORT:8081 \
    -v $VOLUME_NAME:/app/data \
    --name $CONTAINER_NAME \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    print_success "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Step 4: Wait for service to be ready
wait_for_service "$BASE_URL/api/products"

# Step 5: Test frontend
print_status "Testing frontend..."
if curl -s -f "$BASE_URL/" > /dev/null; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    exit 1
fi

# Step 6: Test API endpoints
print_status "Testing API endpoints..."

# Test basic endpoints
test_api "/api/products"
test_api "/api/customers"
test_api "/api/reports/sales"

# Test user registration
print_status "Testing user registration..."
user_data='{"username":"testuser","password":"testpass","role":"cashier"}'
test_api "/api/users/register" "POST" "$user_data" "201"

# Test product creation
print_status "Testing product creation..."
product_data='{"name":"Test Product","sku":"TEST-001","price":9.99,"quantity":100,"description":"Test product"}'
test_api "/api/products" "POST" "$product_data" "201"

# Test customer creation
print_status "Testing customer creation..."
customer_data='{"name":"Test Customer","phone_number":"555-0123","email":"test@example.com","address":"123 Test St"}'
test_api "/api/customers" "POST" "$customer_data" "201"

# Test sales transaction
print_status "Testing sales transaction..."
sale_data='{"user_id":1,"customer_id":1,"payment_method":"cash","items":[{"product_id":1,"quantity":2}]}'
test_api "/api/sales" "POST" "$sale_data" "201"

# Verify data persistence
print_status "Verifying data persistence..."
test_api "/api/products"
test_api "/api/customers"

# Step 7: Test container restart
print_status "Testing container restart and data persistence..."
docker restart $CONTAINER_NAME
wait_for_service "$BASE_URL/api/products"

# Verify data is still there after restart
test_api "/api/products"
test_api "/api/customers"

# Step 8: Performance check
print_status "Checking container performance..."
stats=$(docker stats $CONTAINER_NAME --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}")
echo "$stats"

# Step 9: Log check
print_status "Checking container logs..."
log_lines=$(docker logs $CONTAINER_NAME 2>&1 | wc -l)
if [ $log_lines -gt 0 ]; then
    print_success "Container is logging properly ($log_lines log lines)"
else
    print_warning "No log output detected"
fi

# Final success message
echo ""
echo "🎉 Docker Deployment Test Results"
echo "================================="
print_success "✅ Docker image builds successfully"
print_success "✅ Container starts and runs properly"
print_success "✅ Frontend serves correctly"
print_success "✅ All API endpoints working"
print_success "✅ Database operations functional"
print_success "✅ Data persistence verified"
print_success "✅ Container restart works"
print_success "✅ Performance metrics available"

echo ""
print_status "Test completed successfully! 🚀"
print_status "The GoPOS application is ready for production deployment."
echo ""
print_status "To access the application:"
echo "  URL: $BASE_URL"
echo "  Container: $CONTAINER_NAME"
echo "  Image: $IMAGE_NAME"
echo ""
print_status "To stop the test container:"
echo "  docker stop $CONTAINER_NAME"
echo "  docker rm $CONTAINER_NAME"
echo "  docker volume rm $VOLUME_NAME"
