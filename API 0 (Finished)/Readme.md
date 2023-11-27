# Motives
### Ground Truth
Cloud Computing plays the core role in the development of the Android application to function, fully responsible for the APIs development. The APIs handle Android application requests to respond to a JSON format of information required by the app. The APIs that Cloud Computing is accountable for incorporate:
1. API 1
   - Version a: handling requests for nearby SOS stations
   - Version b: handling requests for user authentication
2. API 2: handling requests for transcribing a voice into text
3. API 3: handling requests for exercising face identification model
### Technique
1. We use JavaScript as our main and only programming language for Backend, followed by Node.JS as the runtime and Hapi.JS as the web framework. 
2. We use Cloud Run as our main and only computing service to handle requests and restrict the Cloud Run access (only the corresponding Cloud Run Invoker service account holder can invoke the service).
3. We use Cloud Firestore as our main database service to store users' identities, emails, and passwords. All data stored is encrypted.
4. We use Cloud Storage to store our Machine Learning model and to store users' faces with fine-grained access, granting users' privacy integrity.
5. We use Google Maps Platform as our main external API to develop API 1a.

### Cost-Estimation

<table>
<tr>
<th>Context</th>
<th>Configuration</th>
<th>Units</th>
<th>Estimated</th>
</tr>
<tr>
<td>Cloud Run Service</td>
<td>2 v-CPU 4 GiBs running / 15-days non stop per month</td>
<td>$0.00002160 / v-CPU second + $0.00000240 / GiB second</td>
<td>$33.38 / 15-days non stop per month</td>
</tr>
<tr>
<td>Firestore</td>
<td>Less than 20000 requests</td>
<td>$1.502 / 1M documents (Beyond free quota + Document read, write, delete)</td>
<td>$0.00 / month</td>
</tr>
<tr>
<td>Cloud Storage</td>
<td>10 GB usage of Nearline Storage</td>
<td>$0.016 GB / month</td>
<td>$0.16 / month</td>
</tr>
<tr>
<td>Place API (New)</td>
<td>Nearby Search Basic for 2000 requests</td>
<td>$32.00 / 1000 requests</td>
<td>$64.00 / 2000 requests</td>
</tr>
<tr>
<td>Geocoding API</td>
<td>Geocoding for 2000 requests</td>
<td>$5.00 / 1000 requests</td>
<td>$10.00 / 2000 requests</td>
</tr>
<tr>
<td>Distance Matrix API</td>
<td>Geocoding for 2000 requests</td>
<td>$10.00 / 1000 requests</td>
<td>$20.00 / 2000 requests</td>
</tr>
<tr>
<td colspan="3">TOTAL</td>
<td>$127.54 / month</td>
</table>















