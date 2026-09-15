VERSION 0.8
FROM hub.hamdocker.ir/library/node:20.10-bookworm

WORKDIR /app

deps:
    COPY package.json package-lock.json ./
    npm config set loglevel verbose
    RUN npm ci

build:
    FROM +deps
    COPY . .
    ARG --required REF_NAME
    IF [ $REF_NAME != "stage" ]
      RUN npm version $REF_NAME
    END
    RUN npm run build
    SAVE ARTIFACT dist /dist

docker:
    FROM hub.hamdocker.ir/library/nginx:bookworm
    EXPOSE 80
    COPY +build/dist /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/nginx.conf
    ARG --required REF_NAME
    ARG --required CONTAINER_IMAGE_PREFIX
    SAVE IMAGE --push $CONTAINER_IMAGE_PREFIX/crm-sitra-front:$REF_NAME


