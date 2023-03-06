FROM node:12-alpine
ADD . /app
WORKDIR /app
RUN npm install
CMD [ "node", "server.js" ]
