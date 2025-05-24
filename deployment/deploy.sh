#!/bin/bash

# Script to deploy Subnest application to production environment
# This script automates the deployment process for all components

echo "Starting Subnest deployment process..."

# Create necessary directories
mkdir -p /home/ubuntu/subnest/deployment/nginx/ssl
mkdir -p /home/ubuntu/subnest/deployment/nginx/conf.d
mkdir -p /home/ubuntu/subnest/deployment/nginx/www

# Copy configuration files
cp /home/ubuntu/subnest/deployment/nginx.conf /home/ubuntu/subnest/deployment/nginx/conf.d/default.conf
cp /home/ubuntu/subnest/deployment/backend-dockerfile /home/ubuntu/subnest/backend/Dockerfile
cp /home/ubuntu/subnest/deployment/frontend-dockerfile /home/ubuntu/subnest/frontend/Dockerfile

# Generate self-signed SSL certificate for development/testing
echo "Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /home/ubuntu/subnest/deployment/nginx/ssl/subnest.key \
  -out /home/ubuntu/subnest/deployment/nginx/ssl/subnest.crt \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Subnest/OU=IT/CN=subnest.com"

# Build and start the services
echo "Building and starting services..."
cd /home/ubuntu/subnest
docker-compose -f /home/ubuntu/subnest/deployment/docker-compose.yml build
docker-compose -f /home/ubuntu/subnest/deployment/docker-compose.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Run database migrations
echo "Running database migrations..."
docker-compose -f /home/ubuntu/subnest/deployment/docker-compose.yml exec backend npm run migrate

# Run smoke tests
echo "Running smoke tests..."
docker-compose -f /home/ubuntu/subnest/deployment/docker-compose.yml exec backend npm run test:smoke

echo "Deployment completed successfully!"
echo "Subnest application is now running at https://subnest.com"
echo "API is accessible at https://api.subnest.com"

# Display container status
echo "Container status:"
docker-compose -f /home/ubuntu/subnest/deployment/docker-compose.yml ps
