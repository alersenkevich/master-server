FROM node:latest

WORKDIR /app

# Install app dependencies
COPY package.json /app
COPY . /app
RUN npm install && npm run build && cp -R ./src/views ./dist/views/ && npm start

EXPOSE 8002

CMD [ "npm", "start" ]