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
        python3 \
        unzip \
        wget && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install OpenDDS
ADD https://docs.len-iot.id/s/xm9zTrTASaBxd8p/download/OpenDDS-3.29.1.zip OpenDDS-3.29.1.zip
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

# Copy application files
COPY server.js ./

# Copy IDL directory, lalu resolve symlink agar .so tidak broken di container
COPY idl ./idl/
RUN find /app/idl -type l -name "*.so" | while read link; do \
        target=$(readlink -f "$link"); \
        rm "$link"; \
        cp "$target" "$link"; \
    done

EXPOSE 8080

CMD ["node", "server.js", "-DCPSConfigFile", "/app/rtps.ini"]
