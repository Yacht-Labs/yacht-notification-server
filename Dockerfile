FROM node:14.18.3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
RUN npx prisma generate
CMD ["npm", "run", "db-init", "&&", "npx", "ts-node", "src/server/index.ts"]