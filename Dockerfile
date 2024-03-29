# == base ======================
FROM buildpack-deps:bookworm AS base
RUN apt update

# Rust envvars
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUST_VERSION=1.77.0

# == node ======================
FROM base AS node
COPY nodesource.gpg /etc/apt/keyrings/nodesource.gpg
COPY <<EOF /etc/apt/sources.list.d/nodesource.list
deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main
EOF
RUN --mount=type=cache,target=/var/cache/apt,id=framework-runtime-node \
    apt update \
    && apt install -y --no-install-recommends nodejs \
    && npm install --global yarn

# == python ======================
FROM base AS python
RUN --mount=type=cache,target=/var/cache/apt,id=framework-runtime-python \
    apt install -y --no-install-recommends \
      python3 \
      python3-pip \
      python3-setuptools \
      python3-wheel \
      python3-dev \
      python3-venv

# == R ===========================
FROM base AS r
COPY r-project.gpg /etc/apt/keyrings/r-project.gpg
COPY <<EOF /etc/apt/sources.list.d/r-project.list
deb [signed-by=/etc/apt/keyrings/r-project.gpg] http://cloud.r-project.org/bin/linux/debian bookworm-cran40/
EOF
RUN --mount=type=cache,target=/var/cache/apt,id=framework-runtime-r \
    apt update \
    && apt install -y --no-install-recommends \
      r-base-core \
      r-recommended

# == duckdb ======================
FROM base AS duckdb
RUN cd $(mktemp -d) \
    && wget https://github.com/duckdb/duckdb/releases/download/v0.10.1/duckdb_cli-linux-amd64.zip \
    && unzip duckdb_cli-linux-amd64.zip \
    && install -m 0755 duckdb /usr/bin/duckdb

# == rust ========================
FROM base AS rust
# Based on https://github.com/rust-lang/docker-rust/blob/c8d1e4f5c563dacb16b2aadf827f1be3ff3ac25b/1.77.0/bookworm/Dockerfile
RUN set -eux; \
    dpkgArch="$(dpkg --print-architecture)"; \
    case "${dpkgArch##*-}" in \
        amd64) rustArch='x86_64-unknown-linux-gnu'; rustupSha256='a3d541a5484c8fa2f1c21478a6f6c505a778d473c21d60a18a4df5185d320ef8' ;; \
        arm64) rustArch='aarch64-unknown-linux-gnu'; rustupSha256='76cd420cb8a82e540025c5f97bda3c65ceb0b0661d5843e6ef177479813b0367' ;; \
        *) echo >&2 "unsupported architecture: ${dpkgArch}"; exit 1 ;; \
    esac; \
    url="https://static.rust-lang.org/rustup/archive/1.27.0/${rustArch}/rustup-init"; \
    wget "$url"; \
    echo "${rustupSha256} *rustup-init" | sha256sum -c -; \
    chmod +x rustup-init; \
    ./rustup-init -y --no-modify-path --profile minimal --default-toolchain $RUST_VERSION --default-host ${rustArch}; \
    rm rustup-init; \
    chmod -R a+w $RUSTUP_HOME $CARGO_HOME;
RUN cargo install rust-script

# == runtime =====================
FROM base AS runtime
COPY --from=node . .
COPY --from=python . .
COPY --from=r . .
COPY --from=duckdb . .
COPY --from=rust . .
