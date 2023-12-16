FROM node:18.12.1
WORKDIR /app

RUN mkdir -p /app/API_1a /app/security_modules /tmp/

COPY /API_1a/ /app/API_1a
COPY /security_modules/ /app/security_modules

WORKDIR /app/API_1a

RUN npm install

ENV PORT 9001
EXPOSE 9001
CMD ["npm", "run", "start"]