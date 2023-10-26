#!/bin/bash -le

HOST_IP="${HOST_IP:-$(/sbin/ip route|awk '/default/ { print $3 }')}"

cat <<END>> /etc/profile.d/image-factory-env.sh
export ETCD_HOST='${ETCD_HOST:-$HOST_IP}'
export ETCD_PORT='${ETCD_PORT:-4001}'
export ETCD_TOTEM_BASE='${ETCD_TOTEM_BASE:-/totem}'
export SSH_HOST_KEY='${SSH_HOST_KEY:-/root/.ssh/id_rsa}'
export ENC_PASSPHRASE='${ENC_PASSPHRASE:-password}'
export TOTEM_ENV='${TOTEM_ENV:-local}'
export DOCKER_REPO_BASE='${DOCKER_REPO_BASE:-quay.io/totem}'
export HOOK_SECRET='${HOOK_SECRET:-changeit}'
export HOOK_POST_URL='${HOOK_POST_URL}'
export BASE_URL='${BASE_URL:-http://172.17.42.1:8080}'
export HIPCHAT_TOKEN='${HIPCHAT_TOKEN}'
export HIPCHAT_ROOM='${HIPCHAT_ROOM}'
export SWF_ENABLED='${SWF_ENABLED:-false}'
export AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}'
export AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}'
export AWS_SWF_DOMAIN='${AWS_SWF_DOMAIN:-totem-local}'
export LOG_IDENTIFIER='${LOG_IDENTIFIER:-image-factory}'
export CONCURRENCY='${CONCURRENCY:-2}'
END

if [ -e /var/run/docker.sock ]; then
    # Disable DIND as docker socket is available
    echo "DIND Support disabled as docker.sock already present"
    if [ -e  /etc/supervisor/conf.d/docker.conf ]; then
      mv /etc/supervisor/conf.d/docker.conf /etc/supervisor/conf.d/docker.conf.disabled
    fi
fi

HOST_DOCKER_VERSION=$(docker version --format {{.Server.Version}})
LOCAL_DOCKER_VERSION=$(docker version --format {{.Client.Version}})

if [ $LOCAL_DOCKER_VERSION != $HOST_DOCKER_VERSION ]; then
  echo "Docker version mismatch, installing docker $DOCKER_HOST_VERSION on client"

  # Install Docker (Fallback to new distribution if fetch from old distribution fails)
  curl --fail -fsSLO https://get.docker.com/builds/Linux/x86_64/docker-$HOST_DOCKER_VERSION.tgz \
      || curl --fail -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-$HOST_DOCKER_VERSION.tgz \
      && tar --strip-components=1 -xvzf docker-$HOST_DOCKER_VERSION.tgz -C /usr/local/bin \

  chmod +x /usr/local/bin/docker
fi

/bin/bash -le -c "/usr/local/bin/supervisord -c /etc/supervisor/supervisord.conf"
