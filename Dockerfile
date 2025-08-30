FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# Expose the port that the backend uses
EXPOSE $PORT

CMD ["npm", "start"]