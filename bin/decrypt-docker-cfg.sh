#!/bin/bash -el

cd /opt/image-factory
cat .dockercfg.enc.b64 | base64 -d > .dockercfg.enc
if [ -f .dockercfg.dec ]; then
    rm .dockercfg.dec
fi
echo "$ENC_PASSPHRASE" | gpg -d --batch --passphrase-fd 0 -o .dockercfg.dec .dockercfg.enc
chown imagefactory: .dockercfg.dec
mv .dockercfg.dec .dockercfg
