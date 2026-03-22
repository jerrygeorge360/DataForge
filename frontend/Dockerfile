FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ARG MARKETPLACE_ADDRESS
ARG FILECOIN_RPC
ARG CHAIN_ID
ENV MARKETPLACE_ADDRESS=$MARKETPLACE_ADDRESS
ENV FILECOIN_RPC=$FILECOIN_RPC
ENV CHAIN_ID=$CHAIN_ID

RUN node --max-old-space-size=4096 node_modules/.bin/vite build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80