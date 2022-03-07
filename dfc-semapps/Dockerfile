FROM node:16-alpine

WORKDIR /server/app

RUN apk add --update --no-cache autoconf libtool automake alpine-sdk

RUN apk add --update --no-cache bash nano

#install yalc to dev (link) (need specific command in compose)
RUN yarn global add yalc
#install yalc to dev (link) (need specific command in compose)
RUN yarn global add nodemon

# overide by compose if volume targeted src
ADD src  ./src
