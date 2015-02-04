#!/bin/bash -le

export ETCD_URL="$ETCD_HOST:$ETCD_PORT"
export ETCDCTL="etcdctl --peers $ETCD_URL"

#Syslog ETCD Entries
$ETCDCTL get $ETCD_TOTEM_BASE/syslog/host || $ETCDCTL set $ETCD_TOTEM_BASE/syslog/host ""


sed -i -e "s/172.17.42.1[:]4001/$ETCD_URL/g" -e "s|/totem|$ETCD_TOTEM_BASE|g" /etc/confd/confd.toml
confd