#!/bin/bash -el

cp /root/.ssh/id_rsa.encrypted /root/.ssh/id_rsa.new
ssh-keygen -P "$ENC_PASSPHRASE" -N '' -p -f /root/.ssh/id_rsa.new
mv /root/.ssh/id_rsa.new /root/.ssh/id_rsa