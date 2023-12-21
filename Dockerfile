# WILL BE MODIFIED BY THE BASH COMMAND (SED)!
# DO NOT EDIT!

FROM node:18.12.1
WORKDIR /app

ARG APIVER=%%BASH%%:APIVER

RUN mkdir -p /app/$APIVER/app/security_modules /tmp/
COPY /$APIVER/ /app/$APIVER
COPY /security_modules/ /app/security_modules

WORKDIR /app/$APIVER

RUN npm install
%%BASH%%:TFJS_NPM_INSTALL?
# RUN npm install @tensorflow/tfjs-node

ENV PORT %%BASH%%:LISTENPORT
EXPOSE %%BASH%%:LISTENPORT

CMD ["npm", "run", "start"]