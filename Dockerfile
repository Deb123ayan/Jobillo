FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Download models and build
RUN npm run setup-models
RUN npm run build:client

# Expose port
EXPOSE 5000

# Start with tsx
CMD ["npm", "start"]