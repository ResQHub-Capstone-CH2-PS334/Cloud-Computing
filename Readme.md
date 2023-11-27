## 🤔 What
This is an unstable version and this version comes after version ground zero.
- Add API 1b backend.
  API 1b is the API that is accountable for verifying new user.

## ℹ️ Status
This version will be revoked in the future once version 1-pre2 is released.

## 🔥 Usage
1. Generating verification key for a certain user by inputting their email
   Request:
   ```bash
	curl -X POST -d '{
		"email": "<USER-EMAIL>"
	}' \
	-H 'Content-Type: application/json' \
	https://resqhub-api1b-backend-[unique]-et.a.run.app/build-vkey
	```
	Response (either one of these):
	```bash
	'{"status": "has-verified"}' #User has been verified
	'{"status": "sent"}' #User verification key has been sent
	```
	❓ **What this end-point does**: generating a 7-digit number verification key. The generated 7-digit number is hashed (slow hash: BCRYPT) using salt (10 rounds) and stored in the Firestore. With this feature, not even the admin of the Cloud Firestore may be able to get the user's verification key. The user will be emailed with the 7-digit number verification key to input in the mobile application. They will be given 5 minutes to fill in.
	
2. Verifying the verification key
   Request:
   ```bash
	curl -X POST -d '{
		"email": "<USER-EMAIL>",
		"vkey": "<VERIFICATION-KEY>"
	}' \
	-H 'Content-Type: application/json' \
	https://resqhub-api1b-backend-[unique]-et.a.run.app/verif-vkey
	```
	Response (either one of these):
	```bash
	'{"status": "not-exist"}' #User does not exist
	'{"status": "has-verified"}' #User has been verified
	'{"status": "expired"}' #User verification key has expired
	'{"status": "verified"}' #User is verified, proceed to data fill-out page
	'{"status": "wrong"}' #User does not input the right verification key
	```
	❓ **What this end-point does**: receiving ```vkey``` to verify it with the hashed verification key stored in the database (Cloud Firestore). If `vkey` + `hashing function` + `salt` = `hased vkey` , hence the verification key matches. Otherwise, it fails. 