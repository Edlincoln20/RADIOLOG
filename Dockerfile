# Build
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Produção
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Configuração para evitar erro 404 ao atualizar páginas com rotas
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
