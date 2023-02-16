FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
RUN npx prisma generate
CMD ["npm", "run", "start:migrate:prod"]