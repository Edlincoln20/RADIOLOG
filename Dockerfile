FROM nginx:alpine
# Copia o seu arquivo html para a pasta que o Nginx usa
COPY index.html /usr/share/nginx/html/index.html
# Expõe a porta 8080 (que o Cloud Run exige)
EXPOSE 8080
# Configura o Nginx para rodar na porta 8080 em vez da 80
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]

