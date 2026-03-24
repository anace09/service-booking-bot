FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN apk add --no-cache netcat-openbsd

CMD sh -c "echo 'Waiting for database...' && until nc -z booking-db 5432; do sleep 2; done && echo 'Database is up!' && npx prisma migrate deploy && npm run start"