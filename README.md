Docker Image Factory
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

## Prerequisits
+ [NodeJS](http://nodejs.org)
+ [Grunt CLI](http://gruntjs.com/)
    To install: `npm install -g grunt-cli`

## Setup

This application is writen in JavaScript for NodeJS. It utilizes NPM for dependency managment and Grunt as a task runner to facilitate testing and releasing.

As with all Node projects, to get started you will need to install the projct dependencies. Do this by running the following from the root of this project:

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

## Running

The docker image for the Image Factory runs Docker-in-Docker and therefor has several unique requirements when running the image. Most notably you need to run the image in a `--privileged` mode with custom LXC arguments to disable AppArmor. An example run command is below:

```bash
docker run -P -d -h image-factory.$USER --privileged --lxc-conf="lxc.aa_profile=unconfined"  <image-name>
```

## Best Practices

This project uses the [Git Flow](https://confluence.meltdev.com/display/DEV/Git+Flow) process for getting changes into the project.
