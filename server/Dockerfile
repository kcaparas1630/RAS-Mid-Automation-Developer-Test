# Dockerfile for Render deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port (Render will set PORT env variable)
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]
