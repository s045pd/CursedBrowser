FROM node:12.16.2-stretch

WORKDIR /work/
COPY utils.js api-server.js server.js database.js docker-entrypoint.sh package.json package-lock.json .
COPY anyproxy/ ./anyproxy/
COPY gui/ ./gui/
RUN npm config set registry https://registry.npm.taobao.org && npm install

RUN /work/anyproxy/bin/anyproxy-ca --generate \
	&& mkdir /work/ssl/ \
	&& cp /root/.anyproxy/certificates/rootCA.* /work/ssl/ 

WORKDIR /work/gui
RUN npm install && npm run build 
RUN apt-get clean && npm cache clean -f

ENTRYPOINT ["/work/docker-entrypoint.sh"]