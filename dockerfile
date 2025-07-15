FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/database ./database
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/src ./src

RUN apt-get update && apt-get install -y dos2unix wget

RUN wget https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh && \
    dos2unix wait-for-it.sh && \
    chmod +x wait-for-it.sh

EXPOSE 8000
CMD ["node", "run", "start"]