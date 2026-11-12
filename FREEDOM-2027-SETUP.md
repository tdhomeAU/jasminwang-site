# Freedom 2027 registration (staging)
Public path: /freedom-2027/ . Form POST: /api/freedom-2027/register .
This branch is NOT deployed. No public QR should be distributed yet.
Cloudflare Pages deployment needs a D1 database binding named FREEDOM_DB. Apply migrations/0001_freedom_registrations.sql to that D1 database before activating registration.
No email is sent yet: the API intentionally returns emailSent:false. Set up a verified transactional mail service and recipient yingsun7100@gmail.com before claiming automatic email delivery. Do not put email API secrets or registration data in GitHub.
Use access-controlled admin tooling for viewing registrants. Do not expose a public registrations endpoint.
Test successful write, invalid inputs, mobile layout, consent, duplicate submissions, and confirmation page before promoting to production.
Invitation QR must be generated from the verified live https://jasminwang.com/freedom-2027/ URL after deployment. The illustration QR on the poster is NOT valid.
