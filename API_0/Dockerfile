FROM node:18.12.1
WORKDIR /app
ENV PORT 9000
COPY . .
RUN npm install
EXPOSE 9000
CMD [ "npm", "run", "start"]

# How to Create Artifact Container Registry:
# Usage:
# !gcloud artifacts repositories create my-docker-repo --repository-format=docker --location=us-central1 --description="Docker Rep."
# !gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/my-docker-repo/my-image:tag1

# Get .kube/config.yaml
# gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/rai-capstone-pre-dev/my-docker-repo/myewx:tag1
# !gcloud container clusters get-credentials <CLUSTER-NAME> --project=<PROJECT-ID> --region=<CLUSTER-REGION>

# Deploy image
# kubectl apply -f app-config.yaml

# !gcloud artifacts repositories create invoker-testing --repository-format=docker --location=us-central1 --description="Docker Rep."
# !gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/quiet-walker-401407/invoker-testing/invoker-private:tag1

# !gcloud artifacts repositories create survey-app --repository-format=docker --location=us-central1
# !gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/quiet-walker-401407/survey-app/survey-app:tag1