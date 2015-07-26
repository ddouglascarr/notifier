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

ENTRYPOINT ["make", "run"]


# To launch:
# docker run -it \
#     --link dos-mongo:mongo \
#     -v /local/path/to/repo/notifier:/opt/notifier \
#     --name dos-notifier_0 \
#     democracyos-notifier

