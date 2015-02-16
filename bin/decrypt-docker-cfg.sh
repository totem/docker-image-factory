#!/bin/bash -el

cd /root
cat .dockercfg.enc.b64 | base64 -d > .dockercfg.enc
if [ -f .dockercfg.dec ]; then
    rm .dockercfg.dec
fi
echo "$ENC_PASSPHRASE" | gpg -d --batch --passphrase-fd 0 -o .dockercfg.dec .dockercfg.enc
mv .dockercfg.dec .dockercfg
