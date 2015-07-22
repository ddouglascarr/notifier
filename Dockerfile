FROM debian:latest

RUN apt-get update && apt-get install -y \
    git \
    nodejs \
    npm && \
    ln -s /usr/bin/nodejs /usr/bin/node

RUN cd /opt && \
    git clone https://github.com/DemocracyOS/notifier.git && \
    cd notifier && \
    npm install

EXPOSE 9001
ENV NODE_ENV docker
WORKDIR /opt/notifier

ENTRYPOINT ["make"]


# To run, linked to a library/mongo image and using local source
# npm install will have to have been run locally
# $ docker run -it --link host_mongo:mongo -v /local/path/to/repo/notifier:/opt/notifier --name notifier democracyos-notifier

