# Estágio 1: Construir
FROM node:18 AS build-stage
WORKDIR /app

# Copie os arquivos de configuração
COPY package*.json ./
RUN npm install

# Copiar o restante e fazer o build
COPY . .
RUN npm run build

# Estágio 2: Produção (Nginx)
FROM nginx:stable-alpine

# Copia os arquivos gerados pelo Vite/React para o Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Configuração para garantir que as rotas do React funcionem (SPA)
# Note que aqui usamos 'RUN' e os comandos em inglês
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Comando para rodar o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
