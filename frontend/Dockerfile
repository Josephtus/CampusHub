FROM node:18-alpine

WORKDIR /app

# Bağımlılıkları kopyala ve kur
COPY package*.json ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Vite varsayılan portu
EXPOSE 5173

# Frontend'i dış dünyaya açık şekilde başlat
CMD ["npm", "run", "dev", "--", "--host"]