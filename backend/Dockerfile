FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN touch agent_log.json transfer_log.json agent.json

EXPOSE 4000

CMD ["npx", "tsx", "agent_server.ts"]