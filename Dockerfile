FROM ubuntu:jammy

ENV DEBIAN_FRONTEND noninteractive
ENV CONFD_VERSION 0.6.2
ENV ETCDCTL_VERSION v0.4.6

RUN apt-get update --fix-missing && \
    apt-get install -y \
        wget curl build-essential patch git-core openssl libssl-dev unzip ca-certificates \
        git docker.io openssh-client python3 python3-pip python2 \
        && \
    curl http://nodejs.org/dist/v0.10.48/node-v0.10.48-linux-x64.tar.gz | tar xzvf - --strip-components=1 -C "/usr" && \
    apt-get clean && \
    mkdir -p /usr/local/bin && \
    rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*

##SSH Folder for known_hosts
RUN mkdir -p  /root/.ssh && chmod  500 /root/.ssh && chown -R root:root /root/.ssh

#Confd
RUN curl -L https://github.com/kelseyhightower/confd/releases/download/v$CONFD_VERSION/confd-${CONFD_VERSION}-linux-amd64 -o /usr/local/bin/confd && \
    chmod 555 /usr/local/bin/confd

#Etcdctl
RUN curl -L https://github.com/coreos/etcd/releases/download/$ETCDCTL_VERSION/etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz -o /tmp/etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz && \
    cd /tmp && gzip -dc etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz | tar -xof - && \
    cp -f /tmp/etcd-$ETCDCTL_VERSION-linux-amd64/etcdctl /usr/local/bin && \
    rm -rf /tmp/etcd-$ETCDCTL_VERSION-linux-amd64 && \
    rm -rf /tmp/etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz

#Supervisor Config
RUN pip install supervisor git+https://github.com/coderanger/supervisor-stdout && \
    mkdir -p /var/log/supervisor
ADD bin/supervisord-wrapper.sh /usr/sbin/supervisord-wrapper.sh
RUN chmod +x /usr/sbin/supervisord-wrapper.sh && ln -sf /etc/supervisor/supervisord.conf /etc/supervisord.conf

#Confd Defaults
ADD bin/confd-wrapper.sh /usr/sbin/confd-wrapper.sh
RUN chmod +x /usr/sbin/confd-wrapper.sh

#Custom Scripts
ADD bin/decrypt-ssh-keys.sh /usr/local/bin/
ADD bin/decrypt-docker-cfg.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/decrypt-ssh-keys.sh /usr/local/bin/decrypt-docker-cfg.sh

# Add update git timestamp script
ADD bin/update-git-ts.sh /usr/local/bin/update-git-ts.sh
RUN chmod +x /usr/local/bin/update-git-ts.sh

WORKDIR /opt/image-factory

# Configure GitHub
RUN ssh-keyscan -H github.com | tee -a /root/.ssh/known_hosts && chmod -R 400 /root/.ssh/*

# Install Image Factory
ADD package.json /opt/image-factory/
RUN rm -rf node_modules
ADD . /opt/image-factory

RUN mv npm-shrinkwrap-linux.json /opt/image-factory/npm-shrinkwrap.json
RUN set -e; cd /opt/image-factory; npm install --no-optional --production; npm dedupe; npm cache clean

#Etc Config
ADD etc /etc

# Image Factory / Docker
EXPOSE 8080

VOLUME /var/lib/docker

ENTRYPOINT ["/usr/sbin/supervisord-wrapper.sh"]
CMD [""]
