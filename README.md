# framework-runtime

This repository builds a Docker image suitable for building Observable Framework projects in.

It includes support for running Framework data loaders with the following languages and tools:

- Node 20
- Python 3.11
- R 4.3
- duckdb 0.10.1
- Rust 1.77

## Usage

This will be published on a public repository soon. In the mean time, please use the local development instructions below.

## Local development

From this repository, run

```
yarn install
yarn build
```

This will install dependencies needed for the repository, and build the image.

To run the image, you can use the command

```
docker run -it observablehq/framework-runtime:latest bash
```

This will launch a shell in the runtime environment. From here you should be able to clone repositories, use `npm init @observablehq`, and otherwise interact with Framework projects. Not that after exiting the shell any files you worked with will be lost. Consider using [Docker Volumes](https://docs.docker.com/storage/volumes/) if you want a persistent environment.
