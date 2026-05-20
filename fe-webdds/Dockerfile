# Basis image Node modern yang ringan
FROM node:20-alpine

WORKDIR /app

# Install pnpm (sesuai package manager proyek)
RUN npm install -g pnpm@9

# Menyalin file dependensi dulu (cache layer)
COPY package.json pnpm-lock.yaml ./

# Install dependensi
RUN pnpm install --frozen-lockfile

# Salin seluruh kode proyek
COPY . .

# Ekspos port default
EXPOSE 3000

# Jalankan server development Rspack
CMD ["pnpm", "run", "dev"]
