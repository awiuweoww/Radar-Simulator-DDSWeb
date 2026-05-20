# Gateway OMG DDS-WEB (Node.js + OpenDDS)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js 20 dan dependensi build
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        g++ \
        gcc \
        make \
        perl \
        python3 \
        unzip \
        wget && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install OpenDDS
COPY OpenDDS-3.29.1.zip OpenDDS-3.29.1.zip
RUN unzip OpenDDS-3.29.1.zip && \
    mv OpenDDS-3.29.1 /opt/OpenDDS && \
    rm OpenDDS-3.29.1.zip

# Environment OpenDDS
ENV ACE_ROOT="/opt/OpenDDS/ACE_wrappers" \
    TAO_ROOT="/opt/OpenDDS/ACE_wrappers/TAO" \
    DDS_ROOT="/opt/OpenDDS" \
    LD_LIBRARY_PATH="/opt/OpenDDS/ACE_wrappers/lib:/opt/OpenDDS/lib:${LD_LIBRARY_PATH}" \
    MPC_ROOT="/opt/OpenDDS/ACE_wrappers/MPC" \
    PATH="/opt/OpenDDS/ACE_wrappers/bin:/opt/OpenDDS/bin:${PATH}"

WORKDIR /app

# Install npm dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy IDL directory dan workspace file (done BEFORE copying application code to leverage caching)
COPY idl ./idl/
COPY gateway_idl.mwc ./idl/

# Compile IDL agar library .so cocok dengan glibc container
RUN cd idl && \
    $MPC_ROOT/mwc.pl -type gnuace gateway_idl.mwc && \
    make clean && \
    make -j2

# Copy application files (Node.js code is copied at the very end so that server.js changes take less than 1 second to build)
COPY server.js ./

EXPOSE 8080

CMD ["node", "server.js", "-DCPSConfigFile", "/app/rtps.ini"]
