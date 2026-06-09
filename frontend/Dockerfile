FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run preview server or expose vite directly for dev
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
