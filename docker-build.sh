#!/bin/bash
set -e
docker ps -a | grep cursed | awk '{print $1}' | xargs docker rm -f
docker images | grep cursed | awk '{print $3}' | xargs docker rmi -f
docker-compose up --build --force-recreate
