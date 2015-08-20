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
END

if [ -e /var/run/docker.sock ]; then
    # Disable DIND as docker socket is available
    echo "DIND Support diabled as docker.sock already present"
    mv /etc/supervisor/conf.d/docker.conf /etc/supervisor/conf.d/docker.conf.disabled
fi

/bin/bash -le -c "/usr/local/bin/supervisord -c /etc/supervisor/supervisord.conf"

