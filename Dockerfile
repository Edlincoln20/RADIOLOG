# Estágio 1: Build
FROM node:18 AS build-stage
WORKDIR /app

# Copia os arquivos de configuração primeiro para aproveitar o cache das camadas
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos e faz o build
COPY . .
RUN npm run build

# Estágio 2: Produção (Servidor leve)
FROM nginx:stable-alpine
# O Vite gera os arquivos na pasta /dist por padrão
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Configuração para garantir que as rotas do React funcionem (Single Page Application)
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
