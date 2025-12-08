# Dockerfile for Render deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install instead of npm ci)
RUN npm install --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm install --save-dev typescript @types/node
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port (Render will set PORT env variable)
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]
