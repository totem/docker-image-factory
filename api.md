FORMAT: X-1A

# Image Factory API

This document describes the API endpoints available for the Image Factory. With this API you can request a new Job to build a Docker image from a GitHub repository and susiquently publish the built image in a Docker Registry.

**Note:** This document follows the API documentation guidelines specified by the [API Blueprint](http://apiblueprint.org) Project. You can find the spec, [examples](https://github.com/apiaryio/api-blueprint/tree/master/examples) and parsers on their site.

# API ROOT [/]

## Describe The API [GET]

+ Response 200 (application/json)

    + Headers

        ```
        Link: </_schema/ROOT>; rel="describedBy"
        ```

    + Body

        ```js
        {}
        ```

    + Schema

        ```js
        {
          "$schema": "http://json-schema.org/draft-04/schema",
          "type":"object",
          "links": [
            {
              "rel": "list-jobs",
              "href": "/job",
              "method": "GET",
              "mediaType": "application/vnd.sh.melt.cdp.if.job-list.v1+json"
            },
            {
              "rel": "create-job",
              "href": "/job",
              "method": "POST",
              "mediaType": "application/vnd.sh.melt.cdp.if.job-create.v1+json",
              "schema": {
                "type":"object",
                "properties": {
                  "branch": {
                    "type": "string"
                  },
                  "commit": {
                    "type": "string"
                  },
                  "owner": {
                    "type": "string"
                  },
                  "repo": {
                    "type": "string"
                  },
                  "realm": {
                    "type": "string"
                  }
                },
                "required": ["owner", "repo"]
              }
            }
          ]
        }
        ```

# Job [/job]

A Job represents a build request where a GitHub repository will be checked out, built using `docker build`, then pushed to a docker repository using `docker push`.

## Retrieve All Jobs [GET]
This will return a list of all current and past Job's know by the Image Factory. **Note:** Job's are only stored in memory and therefor are ephemeral. At this point, you can not rely on a Job persisting in the system.

+ Response 200 (application/vnd.sh.melt.cdp.if.job-list.v1+json)

    + Headers

        ```
        Link: </_schema/job-list>; rel="describedBy"
        ```

    + Body

        ```js
        [
          {
            "id": "gJRTCG1je",
            "context": {
              "owner": "meltmedia",
              "repo": "cdp-spec-java",
              "branch": "develop",
              "commit": "c95fa1de94c7bee554a97f31a14a2f7de92133ee",
              "realm": "dev"
            },
            "image": "u.melt.sh/meltmedia/cdp-spec-java:c95fa1de94c7bee554a97f31a14a2f7de92133ee",
            "status": "running",
            "results": {
              "clone": {
                "status": "running"
              },
              "checkout": {
                "status": "pending"
              },
              "build": {
                "status": "pending"
              },
              "push": {
                "status": "pending"
              }
            },
            "startTime": "2013-08-23T19:42:52.013Z",
            "endTime": null
          }
        ]
        ```

    + Schema

        ```js
        {
          "$schema": "http://json-schema.org/draft-04/schema",
          "type":"array",
          "items": { "$ref": "/_schema/job" }
        }
        ```

## Request New Job [POST]
Initiate a Job by requesting a new build to occur.

+ Request (application/vnd.sh.melt.cdp.if.job-create.v1+json)

    + Body

        ```js
        {
          "owner": "meltmedia",
          "repo": "cdp-spec-java",
          "branch": "develop",
          "commit": "c95fa1de94c7bee554a97f31a14a2f7de92133ee",
          "realm": "dev"
        }
        ```

    + Schema

        ```js
        {
          "$schema": "http://json-schema.org/draft-04/schema",
          "type": "object",
          "properties": {
            "branch": {
              "type": "string"
            },
            "commit": {
              "type": "string"
            },
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "realm": {
              "type": "string"
            }
          },
          "required": ["owner", "repo"]
        }
        ```

+ Response 201 (application/vnd.sh.melt.cdp.if.job.v1+json)

    + Headers

        ```
        Link: </_schema/job>; rel="describedBy"
        ```

    + Body

        ```js
        {
          "id": "gJRTCG1je",
          "context": {
            "owner": "meltmedia",
            "repo": "cdp-spec-java",
            "branch": "develop",
            "commit": "c95fa1de94c7bee554a97f31a14a2f7de92133ee",
            "realm": "dev"
          },
          "image": "u.melt.sh/meltmedia/cdp-spec-java:c95fa1de94c7bee554a97f31a14a2f7de92133ee",
          "status": "running",
          "results": {
            "clone": {
              "status": "running"
            },
            "checkout": {
              "status": "pending"
            },
            "build": {
              "status": "pending"
            },
            "push": {
              "status": "pending"
            }
          },
          "startTime": "2013-08-23T19:42:52.013Z",
          "endTime": null
        }
        ```

    + Schema

        ```js
        {
          "$schema": "http://json-schema.org/draft-04/schema",
          "type":"object",
          "properties":{
            "id": {
              "type":"string"
            },
            "context": {
              "type":"object",
              "properties": {
                "branch": {
                  "type": "string"
                },
                "commit": {
                  "type": "string"
                },
                "owner": {
                  "type": "string"
                },
                "repo": {
                  "type": "string"
                },
                "realm": {
                  "type": "string"
                }
              },
              "required" : ["owner", "repo"]
            },
            "results": {
              "type":"object",
              "properties":{
                "build": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                },
                "checkout": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                },
                "clone": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                },
                "push": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                }
              }
            },
            "startTime": {
              "type":"string"
            },
            "endTime": {
              "type":"string"
            },
            "status": {
              "type":"string"
            },
            "image": {
              "type":"string"
            }
          },
          "links": [
            {
              "rel": "parent",
              "href": "/job",
              "method": "GET",
              "mediaType": "application/vnd.sh.melt.cdp.if.job-list.v1+json"
            },
            {
              "rel": "job",
              "href": "/job/{id}",
              "method": "GET",
              "mediaType": "application/vnd.sh.melt.cdp.if.job.v1+json"
            },
            {
              "rel": "job-log",
              "href": "/job/{id}/log",
              "method": "GET",
              "mediaType": "text/plain"
            }
          ]
        }
        ```

+ Response 400 (application/json)

    ```js
    {
        "code": "InvalidContent",
        "message": "Your request must include both a 'gitUrl' and 'image' parameter"
    }
    ```


# Job [/job/{id}]

Represents a specific Job.

## Retrieve Job [GET]
This will return the Job corisponding to the `id` provided.

+ Response 200 (application/vnd.sh.melt.cdp.if.job.v1+json)

    + Headers

        ```
        Link: </_schema/job>; rel="describedBy"
        ```

    + Body

        ```js
        {
          "id": "gJRTCG1je",
          "context": {
            "owner": "meltmedia",
            "repo": "cdp-spec-java",
            "branch": "develop",
            "commit": "c95fa1de94c7bee554a97f31a14a2f7de92133ee",
            "realm": "dev"
          },
          "image": "u.melt.sh/meltmedia/cdp-spec-java:c95fa1de94c7bee554a97f31a14a2f7de92133ee",
          "status": "running",
          "results": {
            "clone": {
              "status": "running"
            },
            "checkout": {
              "status": "pending"
            },
            "build": {
              "status": "pending"
            },
            "push": {
              "status": "pending"
            }
          },
          "startTime": "2013-08-23T19:42:52.013Z",
          "endTime": null
        }
        ```

    + Schema

        ```js
        {
          "$schema": "http://json-schema.org/draft-04/schema",
          "type":"object",
          "properties":{
            "id": {
              "type":"string"
            },
            "context": {
              "type":"object",
              "properties": {
                "branch": {
                  "type": "string"
                },
                "commit": {
                  "type": "string"
                },
                "owner": {
                  "type": "string"
                },
                "repo": {
                  "type": "string"
                },
                "realm": {
                  "type": "string"
                }
              },
              "required" : ["owner", "repo"]
            },
            "results": {
              "type":"object",
              "properties":{
                "build": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                },
                "checkout": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                },
                "clone": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                },
                "push": {
                  "type":"object",
                  "properties":{
                    "status": {
                      "type":"string"
                    }
                  }
                }
              }
            },
            "startTime": {
              "type":"string"
            },
            "endTime": {
              "type":"string"
            },
            "status": {
              "type":"string"
            },
            "image": {
              "type":"string"
            }
          },
          "links": [
            {
              "rel": "parent",
              "href": "/job",
              "method": "GET",
              "mediaType": "application/vnd.sh.melt.cdp.if.job-list.v1+json"
            },
            {
              "rel": "job",
              "href": "/job/{id}",
              "method": "GET",
              "mediaType": "application/vnd.sh.melt.cdp.if.job.v1+json"
            },
            {
              "rel": "job-log",
              "href": "/job/{id}/log",
              "method": "GET",
              "mediaType": "text/plain"
            }
          ]
        }
        ```

+ Response 404 (application/json)

    ```js
    {
      code: "ResourceNotFound",
      message: "Unable to locate job with id: {id}"
    }
    ```

# Job Build Log [/job/{id}/log]

Represents the build log for the Job corisponding to `id`. The build log consists of the `stdout` and `stderr` streams of each step required to clone, checkout, build and push the image.

## Retrieve Build Log [GET]
This will return the build log for the Job corisponding to the `id` provided.

+ Response 200 (text/plain)

    ```
    ********************************************************************************
    Executing: git clone --depth 1 --recurse-submodules --branch develop git@github.com:meltmedia/cdp-spec-java.git ./
    --------------------------------------------------------------------------------

    Cloning into '.'...

    --------------------------------------------------------------------------------
    Command git clone --depth 1 --recurse-submodules --branch develop git@github.com:meltmedia/cdp-spec-java.git ./ completed successfuly
    Total execution time: 2281 ms
    ********************************************************************************
    ```

+ Response 404 (application/json)

    ```js
    {
      code: "ResourceNotFound",
      message: "Unable to locate job with id: {id}"
    }
    ```
