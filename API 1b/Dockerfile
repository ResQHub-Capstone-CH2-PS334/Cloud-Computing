FROM node:18.12.1
WORKDIR /app
ENV PORT 9000
COPY . .
RUN npm install
EXPOSE 9000
CMD ["npm", "run", "start"]

# !gcloud artifacts repositories create api1b-be --repository-format=docker --location=us-central1
# !gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/quiet-walker-401407/api1b-be/api1b-be:ver1