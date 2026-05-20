# ===== BUILD STAGE =====
FROM ubuntu:22.04 AS build

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies with minimal packages
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        autoconf \
        bison \
        build-essential \
        ca-certificates \
        ccache \
        curl \
        flex \
        g++ \
        gcc \
        git \
        libssl-dev \
        pkg-config \
        python3 \
        python3-pip \
        tar \
        unzip \
        wget \
        zip \
        zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# Install CMake using precompiled binary (v3.31.3)
COPY cmake-3.31.3-linux-x86_64.tar.gz cmake-3.31.3-linux-x86_64.tar.gz
RUN tar -xzf cmake-3.31.3-linux-x86_64.tar.gz && \
    mv cmake-3.31.3-linux-x86_64 /usr/local/cmake && \
    ln -s /usr/local/cmake/bin/* /usr/local/bin && \
    rm cmake-3.31.3-linux-x86_64.tar.gz

# --- Install OpenDDS (v3.29.1) ---
COPY OpenDDS-3.29.1.zip OpenDDS-3.29.1.zip
RUN unzip OpenDDS-3.29.1.zip && \
    mv OpenDDS-3.29.1 /opt/OpenDDS && \
    rm OpenDDS-3.29.1.zip

# Set environment OpenDDS untuk proses build
ENV ACE_ROOT="/opt/OpenDDS/ACE_wrappers" \
    TAO_ROOT="/opt/OpenDDS/ACE_wrappers/TAO" \
    DDS_ROOT="/opt/OpenDDS" \
    LD_LIBRARY_PATH="/opt/OpenDDS/ACE_wrappers/lib:/opt/OpenDDS/lib:${LD_LIBRARY_PATH}" \
    MPC_ROOT="/opt/OpenDDS/ACE_wrappers/MPC" \
    PATH="/opt/OpenDDS/ACE_wrappers/bin:/opt/OpenDDS/bin:${PATH}"

WORKDIR /app

# Copy configuration files
COPY CMakeLists.txt /app/CMakeLists.txt
COPY conanfile.txt /app/conanfile.txt
COPY CMakeUserPresets.json /app/CMakeUserPresets.json
COPY CMakeModules /app/CMakeModules

# Install and configure Conan 2.x
RUN pip3 install --no-cache-dir conan

RUN conan profile detect --force && \
    conan install . --output-folder=build --build=missing

# Copy source and other files
COPY src /app/src
COPY idl /app/idl
COPY simple.ior /app/
COPY rtps.ini /app/

# Build project using BuildKit ccache mount
RUN --mount=type=cache,target=/root/.ccache \
    cmake --preset conan-release -DCMAKE_CXX_COMPILER_LAUNCHER=ccache -DCMAKE_C_COMPILER_LAUNCHER=ccache && \
    cmake --build "/app/build" --config Release --target all -j2 && \
    cp /app/build/be-stream-odds-cpp /app/be-stream-odds-cpp

# ===== RUNTIME STAGE =====
FROM ubuntu:22.04

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/build/logs
WORKDIR /app/build

# Copy binary and essential files (from the non-cached staging folder)
COPY --from=build /app/be-stream-odds-cpp /app/build/be-stream-odds-cpp
COPY --from=build /app/rtps.ini /app/rtps.ini
COPY --from=build /app/simple.ior /app/simple.ior

# Copy OpenDDS libraries
COPY --from=build /opt/OpenDDS /opt/OpenDDS

# Set environment variables
ENV ACE_ROOT="/opt/OpenDDS/ACE_wrappers" \
    TAO_ROOT="/opt/OpenDDS/ACE_wrappers/TAO" \
    DDS_ROOT="/opt/OpenDDS" \
    LD_LIBRARY_PATH="/opt/OpenDDS/ACE_wrappers/lib:/opt/OpenDDS/lib:${LD_LIBRARY_PATH}" \
    MPC_ROOT="/opt/OpenDDS/ACE_wrappers/MPC" \
    PATH="/opt/OpenDDS/ACE_wrappers/bin:/opt/OpenDDS/bin:${PATH}"

# Security: Non-root user
RUN useradd -ms /bin/bash serviceuser && \
    chown serviceuser:serviceuser -R /app && \
    chmod -R 500 /app && \
    chmod -R 700 /app/build/logs

USER serviceuser

EXPOSE 9090

CMD ["./be-stream-odds-cpp"]
