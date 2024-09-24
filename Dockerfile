# == base ======================
FROM buildpack-deps:bookworm AS base
ENV CACHEBUST=2024-09-17
RUN useradd -m -u 8000 observable-builder && mkdir /project && \
    chown 8000:8000 /project && apt update

ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    RUST_VERSION=1.81.0 \
    VIRTUAL_ENV=/home/observable-builder/.local/python-venv
ENV PATH=/usr/local/cargo/bin:$VIRTUAL_ENV/bin:/home/observable-builder/.local/bin:$PATH

# == node ======================
FROM base AS node
COPY nodesource.gpg /etc/apt/keyrings/nodesource.gpg
COPY <<EOF /etc/apt/sources.list.d/nodesource.list
deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main
EOF
RUN --mount=type=cache,target=/var/cache/apt,id=framework-runtime-node \
    apt update \
    && apt install -y --no-install-recommends nodejs \
    && corepack enable \
    && corepack enable pnpm \
    && npm install --global svgo

# == python ======================
FROM base AS python
RUN --mount=type=cache,target=/var/cache/apt,id=framework-runtime-python \
    apt install -y --no-install-recommends \
      python3 \
      python3-pip \
      python3-setuptools \
      python3-wheel \
      python3-dev \
      python3-venv \
      pipx
USER 8000
RUN pipx install poetry \
    && python3 -m venv $VIRTUAL_ENV

# == R ===========================
FROM base AS r
COPY r-project.gpg /etc/apt/keyrings/r-project.gpg
COPY <<EOF /etc/apt/sources.list.d/r-project.list
deb [signed-by=/etc/apt/keyrings/r-project.gpg] https://cloud.r-project.org/bin/linux/debian bookworm-cran40/
deb-src [signed-by=/etc/apt/keyrings/r-project.gpg] https://cloud.r-project.org/bin/linux/debian bookworm-cran40/
EOF
RUN --mount=type=cache,target=/var/cache/apt,id=framework-runtime-r \
    apt update \
    && apt install -y --no-install-recommends \
      r-base-core \
      r-recommended

# == duckdb ======================
FROM base AS duckdb
RUN cd $(mktemp -d); \
    dpkgArch="$(dpkg --print-architecture)"; \
    version=1.0.0; \
    case "${dpkgArch##*-}" in \
        amd64) duckdbArch='amd64' ;; \
        arm64) duckdbArch='aarch64' ;; \
        *) echo >&2 "unsupported architecture: ${dpkgArch}"; exit 1 ;; \
    esac; \
    wget https://github.com/duckdb/duckdb/releases/download/v${version}/duckdb_cli-linux-${duckdbArch}.zip; \
    unzip duckdb_cli-linux-${duckdbArch}.zip; \
    install -m 0755 duckdb /usr/bin/duckdb;

# == rust ========================
FROM base AS rust
# Based on https://github.com/rust-lang/docker-rust/blob/c8d1e4f5c563dacb16b2aadf827f1be3ff3ac25b/1.77.0/bookworm/Dockerfile
# Install rustup, and then use that to install Rust
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
# Install cargo-binstall, which looks for precompiled binaries of libraries instead of building them here
RUN set -eux; \
    dpkgArch="$(dpkg --print-architecture)"; \
    case "${dpkgArch##*-}" in \
        amd64) binstallArch='x86_64-unknown-linux-gnu' ;; \
        arm64) binstallArch='aarch64-unknown-linux-gnu' ;; \
        *) echo >&2 "unsupported architecture: ${dpkgArch}"; exit 1 ;; \
    esac; \
    url="https://github.com/cargo-bins/cargo-binstall/releases/download/v1.6.4/cargo-binstall-${binstallArch}.tgz"; \
    curl -L --proto '=https' --tlsv1.2 -sSf "$url" | tar -xvzf -; \
    ./cargo-binstall -y --force cargo-binstall
# rust-script is what Framework uses to run Rust data loaders
RUN cargo binstall -y --force rust-script
# all the apache arrow-tools
RUN cargo binstall -y --force csv2arrow csv2parquet json2arrow json2parquet

# == general-cli =================
FROM base AS general-cli
RUN --mount=type=cache,target=/var/cache/apt,id=framework-runtime-general-cli \
    set -eux; \
    apt update; \
    apt install -y --no-install-recommends \
        bind9-dnsutils \
        csvkit \
        iputils-ping \
        iputils-tracepath \
        jq \
        nano \
        netcat-openbsd \
        openssl \
        optipng \
        ripgrep \
        silversearcher-ag \
        vim \
        zstd

# == runtime =====================
FROM base AS runtime
COPY --from=general-cli . .
COPY --from=node . .
COPY --from=python . .
COPY --from=r . .
COPY --from=duckdb . .
COPY --from=rust . .
USER 8000
WORKDIR /project
