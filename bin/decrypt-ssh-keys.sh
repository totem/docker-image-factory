#!/bin/bash -el

cp /opt/image-factory/.ssh/id_rsa.encrypted /opt/image-factory/.ssh/id_rsa.new
ssh-keygen -P "$SSH_PASSPHRASE" -N '' -p -f /opt/image-factory/.ssh/id_rsa.new
mv /opt/image-factory/.ssh/id_rsa.new /opt/image-factory/.ssh/id_rsa
chown -R "imagefactory:" /opt/image-factory/.ssh
