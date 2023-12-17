FROM node:18.12.1
WORKDIR /app

ARG APIVER = rqh-core

RUN mkdir -p /app/$APIVER/app/security_modules /tmp/

COPY /$APIVER/ /app/$APIVER
COPY /security_modules/ /app/security_modules

WORKDIR /app/$APIVER

RUN npm install
RUN npm install @tensorflow/tfjs-node
ENV PORT 9001
EXPOSE 9001
CMD ["npm", "run", "start"]