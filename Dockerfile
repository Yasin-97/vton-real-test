FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Make sure results directory exists with write permissions
RUN mkdir -p public/results && chmod -R 777 public/results

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]