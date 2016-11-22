from node:6.9-wheezy

maintainer James Kyburz "james.kyburz@gmail.com"

RUN apt-get update &&\
  apt-get install -y --force-yes --no-install-recommends\
  ssh &&\
  rm -rf /var/lib/apt/lists/*

ONBUILD WORKDIR /usr/src/app
ONBUILD ADD package.json /usr/src/app/package.json
ONBUILD RUN npm install
ONBUILD ADD . /usr/src/app
ONBUILD CMD npm start
