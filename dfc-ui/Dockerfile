FROM node:14-alpine

WORKDIR /home/node/app

# confirm installation
RUN node -v
RUN npm -v

#install pm2 to production (monitoring) (need specific command in compose)
RUN npm install pm2 -g
#install nodemon to dev (support hot realoading) (need specific command in compose)
RUN npm install nodemon -g

# install tool for npm lib compile in C
RUN apk add --update --no-cache autoconf libtool automake alpine-sdk

# Install app dependencies
COPY package.json .
RUN npm cache clean --force && npm install

# add src & build configuraiton
ADD .babelrc .
ADD webpack.common.js  .
ADD webpack.dev.js  .
ADD webpack.prod.js  .

ADD src  ./src

# build src in dist
RUN npm run build

# Expose ports (for orchestrators and dynamic reverse proxies)
EXPOSE 8080

CMD [ "node", "./dist/server/app.js"]
