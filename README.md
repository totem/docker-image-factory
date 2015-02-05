Docker Image Factory [![Build Status](https://travis-ci.org/totem/docker-image-factory.svg?branch=master)](https://travis-ci.org/totem/docker-image-factory) [![Coverage Status](https://coveralls.io/repos/totem/docker-image-factory/badge.svg)](https://coveralls.io/r/totem/docker-image-factory)
====================
<pre>
  ___                       ___        _                
 |_ _|_ __  __ _ __ _ ___  | __|_ _ __| |_ ___ _ _ _  _ 
  | || '  \/ _` / _` / -_) | _/ _` / _|  _/ _ \ '_| || |
 |___|_|_|_\__,_\__, \___| |_|\__,_\__|\__\___/_|  \_, |
                |___/                              |__/ 
</pre>

This project will build [Docker](http://docker.io) images from a GitHub repository containing a `Dockerfile` and push them to a Docker repository.

This project is intended to be run as one or more stand alone instances within AWS EC2. This is the OSS version of
private image-factory used in totem.

## Documentation

+ [API](api.md)

### Glossary

+ Job - A request to build a docker image from a github repository at a specific branch/commit.
+ Image - A built Docker image used as the starting point for a Docker container.
+ Registry - A location for Docker images to be stores. Compatable with the Docker Registry API.
+ Log - The events from each build step concatinated together.

## Prerequisites (Docker)
+ [Docker 1.1+](http://docker.io)  
+ [Etcd 0.4.6+](https://github.com/coreos/etcd/releases) - Needed for storing encrypted keys, dockerconfig.
+ [Github SSH Key](https://help.github.com/articles/generating-ssh-keys/) - Needed for pulling repositories from github for building docker image.
+ [Quay Account](https://quay.io) - Needed for pushing images to quay.

## Dynamic Config
### Authorized Keys (Optional)
This is needed to allow ssh access to image factory. Only needed for troubleshooting docker in docker issues.
Create authorized_keys file with public keys.  
```
cat <<END>authorized_keys
ssh-rsa AAAAB3NzaC1.....
END
```

Store  authorized_keys to etcd.
```
curl -L http://172.17.42.1:4001/v2/keys/totem/ssh/authorized-keys -XPUT --data-urlencode value@authorized_keys
```

### Github SSH Key (Required for private repositories)
Encrypt the private key using passphrase.
```
ssh-keygen  -N '<passphrase>' -p -f github-deploy
```

Store the encrypted key in etcd.
```
curl -L http://172.17.42.1:4001/v2/keys/totem/image-factory/github-key -XPUT --data-urlencode value@github-deploy
```

### Docker Credentials (.dockercfg)
Create .dockercfg with credentials of quay.io. See [http://docs.quay.io/glossary/access-token.html](http://docs.quay.io/glossary/access-token.html)

Encrypt the credentials using gpg and passhrase (Use same passphrase as the one used for encrypting github ssh key).
```
echo "<passphrase>"  | gpg -c  --batch --passphrase-fd 0  -o .dockercfg.enc  .dockercfg
base64 .dockercfg.enc > .dockercfg.enc.b64
```

Store the encrypted config in etcd.  
```
curl -L http://172.17.42.1:4001/v2/keys/totem/image-factory/dockercfg -XPUT --data-urlencode value@dockercfg.enc.b64
```

## Running

The docker image for the Image Factory runs Docker-in-Docker and therefor has several unique requirements when running the image. Most notably you need to run the image in a `--privileged` mode with custom LXC arguments to disable AppArmor. An example run command is below:

```bash
docker run -P -d -h image-factory.$USER --privileged --lxc-conf="lxc.aa_profile=unconfined" -e 'ENC_PASSPHRASE=<github key/dockercfg passphrase>' totem/image-factory
```

## Run Configuration (Environment Variables)  
| Env Variable | Description | Default Value (Docker)|
| ------------ | ----------- | --------------------- |
| ETCD_HOST | Etcd server host. | 172.17.42.1 |
| ETCD_PORT | Etcd server port. | 4001 |
| ETCD_TOTEM_BASE | Base path for totem configurations | /totem |


## Prerequisites (Development)
+ [NodeJS](http://nodejs.org)
+ [Grunt CLI](http://gruntjs.com/)
    To install: `npm install -g grunt-cli`

## Setup

This application is writen in JavaScript for NodeJS. It utilizes NPM for dependency managment and Grunt as a task runner to facilitate testing and releasing.

As with all Node projects, to get started you will need to install the project dependencies. Do this by running the following from the root of this project:

```bash
npm install
```

## Test

Unit and Integration tests are facilitated using Mocha. To execute the test suite, run:

```bash
grunt test
```

## Image Name

This image can be found in the repository at:

```
totem/image-factory
```

## Building

To build this image, simply run `docker build --rm -t totem/image-factory .` from the root of this repository.

## Best Practices

This project uses the [Git Flow](https://confluence.meltdev.com/display/DEV/Git+Flow) process for getting changes into the project.
