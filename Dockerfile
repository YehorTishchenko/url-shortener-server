# Use Alpine for a small base image
FROM node:26-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files for dependency caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Set environment to production
ENV NODE_ENV=development

EXPOSE 5001

# Start the Fastify server
CMD ["node", "src/server.ts"]
