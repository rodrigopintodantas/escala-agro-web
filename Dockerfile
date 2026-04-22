FROM nexuspull.tjdft.jus.br/library/nginx:1.23.3

COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html/*

WORKDIR /app
COPY dist/ /app/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
