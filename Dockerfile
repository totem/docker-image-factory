FROM totem/nodejs-base:0.10.x-trusty

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update --fix-missing
RUN apt-get install -y git openssh-client iptables ca-certificates lxc aufs-tools nano

##SSH Server (To troubleshoot issues with image factory)
RUN apt-get install -y openssh-server
RUN mkdir /var/run/sshd
RUN mkdir /root/.ssh
RUN chmod  500 /root/.ssh & chown -R root:root /root/.ssh

RUN apt-get clean && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*

# Install Docker
RUN curl -o /usr/local/bin/docker https://get.docker.io/builds/Linux/x86_64/docker-1.4.1
ADD .docker/wrapdocker /usr/local/bin/wrapdocker
RUN chmod +x /usr/local/bin/docker /usr/local/bin/wrapdocker

#Syslog
RUN echo '$PreserveFQDN on' | cat - /etc/rsyslog.conf > /tmp/rsyslog.conf && sudo mv /tmp/rsyslog.conf /etc/rsyslog.conf
RUN sed -i 's~^#\$ModLoad immark\(.*\)$~$ModLoad immark \1~' /etc/rsyslog.conf

#Confd
ENV CONFD_VERSION 0.6.2
RUN curl -L https://github.com/kelseyhightower/confd/releases/download/v$CONFD_VERSION/confd-${CONFD_VERSION}-linux-amd64 -o /usr/local/bin/confd
RUN chmod 555 /usr/local/bin/confd

#Etcdctl
ENV ETCDCTL_VERSION v0.4.6
RUN curl -L https://github.com/coreos/etcd/releases/download/$ETCDCTL_VERSION/etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz -o /tmp/etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz
RUN cd /tmp && gzip -dc etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz | tar -xof -
RUN cp -f /tmp/etcd-$ETCDCTL_VERSION-linux-amd64/etcdctl /usr/local/bin
RUN rm -rf /tmp/etcd-$ETCDCTL_VERSION-linux-amd64.tar.gz

#Supervisor Config
RUN pip install supervisor==3.1.2
RUN mkdir -p /var/log/supervisor
ADD bin/supervisord-wrapper.sh /usr/sbin/supervisord-wrapper.sh
RUN chmod +x /usr/sbin/supervisord-wrapper.sh
RUN ln -sf /etc/supervisor/supervisord.conf /etc/supervisord.conf

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

# Configure GitHub and  SSH Access
ADD .root/.ssh/authorized_keys /root/.ssh/
RUN ssh-keyscan -H github.com | tee -a /root/.ssh/known_hosts && chmod -R 400 /root/.ssh/*

# Install Image Factory
ADD package.json /opt/image-factory/
RUN cd /opt/image-factory; npm install
ADD . /opt/image-factory

#Etc Config
ADD etc /etc

# Service Discovery
ENV DISCOVER image-factory:8080

# Image Factory / Docker
EXPOSE 8080 22

VOLUME /var/lib/docker

ENTRYPOINT ["/usr/sbin/supervisord-wrapper.sh"]
CMD [""]
