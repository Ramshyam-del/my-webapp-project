FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source code
COPY backend/ .

# Expose the port that Railway will assign
EXPOSE $PORT

CMD ["npm", "start"]