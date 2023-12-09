FROM node:18.12.1
WORKDIR /app

RUN mkdir -p /app/API_1b /app/security_modules

COPY "/API 1b/" /app/API_1b
COPY "/security_modules/" /app/security_modules

RUN npm install

WORKDIR /app/API_1b
ENV PORT 9000
EXPOSE 9000
CMD ["npm", "run", "start"]

# !gcloud artifacts repositories create api1b-be --repository-format=docker --location=us-central1
# !gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/quiet-walker-401407/api1b-be/api1b-be:ver1 ./api1b.dockerfile