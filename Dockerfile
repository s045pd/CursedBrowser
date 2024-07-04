FROM node:12.16.2-stretch


COPY sources.list /etc/apt/sources.list
RUN apt update && apt install ffmpeg -y


WORKDIR /work/
COPY anyproxy/ ./anyproxy/
COPY package.json package-lock.json .
RUN npm install


COPY gui/ ./gui/
WORKDIR /work/gui
RUN npm install && npm run build 

WORKDIR /work/
COPY utils.js api-server.js server.js database.js docker-entrypoint.sh .
RUN /work/anyproxy/bin/anyproxy-ca --generate \
	&& mkdir /work/ssl/ \
	&& cp /root/.anyproxy/certificates/rootCA.* /work/ssl/ 
RUN apt-get clean && npm cache clean -f



ENTRYPOINT ["/work/docker-entrypoint.sh"]