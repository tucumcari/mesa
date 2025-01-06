# Synology NAS hosted CI/CD for GPU runners

> TLDR; Gitea was a good choice for me, maybe it would be for you too.

## The requirements

 My overall goal was to run CI/CD workflows that require GPUs. I wanted to run workflows on both public mirrored AND privately hosted repositories and I wanted to exercise my new Homelab setup. For these reasons, I could not just install GitHub runner on a GPU machine. I also avoided Docker compose as I wanted a more hands-on experience to learn about container networking and orchestration.

 The hardware:

 1. A Synology NAS, which will serve as host for the Gitea instance

 2. A workstation with an NVIDIA RTX 4000 series GPU, which will serve as a CI/CD runner

 I needed to choose a git platform implementation. There are really only three self-hosting solutions that have CI/CD capability: Gitlab CE, Gitea, and Gogs. I learned that only Gitea has repository mirroring for free.

 ## The plan

1. Install Gitea on the NAS

    My starting point was this [Gist](https://gist.github.com/adamlwgriffiths/3d7c1f101d0b21757c162d01f1a1f251). Except that there's no reason to use that super out-of-date postgres container. The official `postgres/postgres` container works just fine. When you do this, you (may) need to set the following additional environment variables:

    ```shell
    PGDATA = /var/lib/postgresql/data
    POSTGRES_USER = gitea_user
    POSTGRES_PASSWORD = gitea_pass
    POSTGRES_DB = gitea
    ```

2. Complete the browser-based Gitea install from the workstation

    Hitting the ip address of your NAS with the `HTTP_PORT` specified in Step 1

3. Setup the Gitea runner on the workstation

    ```shell
    # see: https://gitea.com/gitea/act_runner/src/branch/main/examples/docker
    # where:
    #   HTTPS_PORT is set in Step 1 above
    #   GITEA_RUNNER_REGISTRATION_TOKEN is obtained from the "Create new Runner" settings dialog
    docker run -e GITEA_INSTANCE_URL=http://$NAS_URL:$HTTPS_PORT -e GITEA_RUNNER_REGISTRATION_TOKEN=$GITEA_RUNNER_REGISTRATION_TOKEN -v /var/run/docker.sock:/var/run/docker.sock -v $PWD/data:/data --name my_runner gitea/act_runner:nightly
    ```

## Usage

A. Setup a repository mirror from Github, launch your Docker container from Step 3, `.github/workflows` will just run!

B. Write a file to your private Gitea repo at `.gitea/workflows/$name.yml`, import from Github actions at will.
