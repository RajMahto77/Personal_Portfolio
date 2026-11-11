# Raj Mahto – Portfolio
## Run
1. Install Node.js and MongoDB (or create a free MongoDB Atlas database).
2. `cp .env.example .env` and fill in `MONGODB_URI` and the email settings below.
### Get messages in your inbox (Gmail)
1. Turn on 2-Step Verification in your Google account.
2. Go to https://myaccount.google.com/apppasswords and create an App Password.
3. Put your Gmail in `SMTP_USER` and `NOTIFY_EMAIL`, and the 16-character password in `SMTP_PASS` (never your normal password).
Every message is emailed to you (replying goes straight to the visitor) and also saved in MongoDB as a backup.
Other providers (Outlook, Zoho, etc.): change `SMTP_HOST` and `SMTP_PORT` to the values they give you.
3. `npm install && npm start` → http://localhost:3000
## Edit your details
- Email, LinkedIn, experience duration and projects: top of `public/script.js`.
- Add your resume as `public/assets/Raj_Mahto_Resume.pdf` (the Download button points here).
## Reading enquiries
Messages are stored in the `enquiries` collection (use MongoDB Compass or `mongosh`: `db.enquiries.find().sort({createdAt:-1})`). The `emailed` field shows whether the email notification succeeded..
