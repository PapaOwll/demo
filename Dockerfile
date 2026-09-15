FROM hub.cr.parmincloud.ir/library/node:20.10-bookworm AS build

WORKDIR /app

# App version is injected from CI (git tag); read by vite.config.js. Falls back to package.json when unset.
ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

# GlitchTip source map upload: pass --build-arg VITE_GLITCHTIP_AUTH_TOKEN=... to enable.
# When unset, the build skips source map generation and upload entirely.
ARG VITE_GLITCHTIP_AUTH_TOKEN
ENV VITE_GLITCHTIP_AUTH_TOKEN=$VITE_GLITCHTIP_AUTH_TOKEN

COPY package.json package-lock.json ./
RUN npm config set loglevel verbose
RUN npm ci --no-audit

COPY . .
RUN npm run build

FROM hub.cr.parmincloud.ir/library/nginx:bookworm
EXPOSE 80
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
