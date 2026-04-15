FROM nginx:alpine
# Copia tudo que está no seu GitHub para a pasta do servidor
COPY . /usr/share/nginx/html
# Configura a porta que o Google Cloud exige (8080)
EXPOSE 8080
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
