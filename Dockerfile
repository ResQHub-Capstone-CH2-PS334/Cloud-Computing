FROM node:18.12.1
WORKDIR /app

RUN mkdir -p /app/API_1b /app/security_modules /tmp/

COPY /API_1b/ /app/API_1b
COPY /security_modules/ /app/security_modules

WORKDIR /app/API_1b

RUN npm install

ENV PORT 9000
EXPOSE 9000
CMD ["npm", "run", "start"]