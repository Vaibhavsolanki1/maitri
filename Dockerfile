FROM node:18-alpine

WORKDIR /usr/src/app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /usr/src/app/backend

EXPOSE 3000

CMD ["node", "server.js"]
