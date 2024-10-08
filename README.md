# framework-runtime

This repository builds a Docker image suitable for building Observable Framework projects in.

It includes support for running Framework data loaders with the following languages and tools:

- Node 20
- Python 3.11
- R 4.4
- duckdb 1.0
- Rust 1.81
- Perl 5.36

## Usage

The image built from this repository is published on the GitHub container registry.

```
docker run -it ghcr.io/observablehq/framework-runtime
```

## Local development

To build and test the images locally, from this repository, run

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

There are automated tests that ensure that various commands and tools are available, and of the expected versions. To run those, use 

```
yarn test
```
