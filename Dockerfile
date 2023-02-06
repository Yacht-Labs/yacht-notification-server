FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
RUN npx prisma generate
RUN npm run db-deploy
CMD ["npm", "run", "start-production"]