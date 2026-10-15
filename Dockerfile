# Stage 1: build the static files.
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Vite inlines VITE_* variables into the bundle at build time. Pass the public
# URL of the back end here:
#   docker build --build-arg VITE_API_URL=https://api.example.com -t my-front .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# Stage 2: serve the static files with nginx.
FROM nginx:1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
