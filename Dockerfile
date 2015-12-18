from nodesource/trusty:5.3.0

RUN apt-get update &&\
  apt-get install -y --force-yes --no-install-recommends\
  ssh &&\
  rm -rf /var/lib/apt/lists/*

ONBUILD RUN mkdir -p /usr/src/app
ONBUILD WORKDIR /usr/src/app
ONBUILD ADD . /usr/src/app
ONBUILD RUN npm install
ONBUILD CMD npm start
