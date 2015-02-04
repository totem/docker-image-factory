#!/bin/bash -le

cat <<END>> /etc/profile.d/image-factory-env.sh
export ETCD_HOST='${ETCD_HOST:-172.17.42.1}'
export ETCD_PORT='${ETCD_PORT:-4001}'
export ETCD_TOTEM_BASE='${ETCD_TOTEM_BASE:-/totem}'
export SSH_HOST_KEY='${SSH_HOST_KEY:-/root/.ssh/id_rsa}'
export SSH_PASSPHRASE='${SSH_PASSPHRASE}'
export CLUSTER_NAME='${CLUSTER_NAME:-totem-local}'
export QUAY_ORGANIZATION='${QUAY_ORGANIZATION:-totem}'
export QUAY_PREFIX='${QUAY_PREFIX:-totem-}'
export HOOK_SECRET='${HOOK_SECRET:-changeit}'
export HOOK_POST_URL='${HOOK_POST_URL}'
export SWF_ENABLED='${SWF_ENABLED:-false}'
END

/bin/bash -le -c "/usr/local/bin/supervisord -c /etc/supervisor/supervisord.conf"

