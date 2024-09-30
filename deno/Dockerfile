# deno/Dockerfile

FROM denoland/deno:alpine-1.34.0

# Set working directory
WORKDIR /app

# Cache dependencies
COPY deps.ts .
RUN deno cache deps.ts

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
