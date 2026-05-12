# gpg-test

Mobile Web Runner (single-page app) for opening websites in a mobile-friendly iframe shell.

## Run locally
python3 -m http.server 8080
Then open http://localhost:8080

## Private Access + Task Resume
- App auto-generates a private key in localStorage: `mobile_runner_access_key_v1`
- Open with: `?k=<your-generated-key>`
- Keeps browsing state in localStorage and resumes after reload.
