# ArenaPulse — Environment Variables Setup Guide

---

## client/.env

| Variable | Value | How to Get It |
|---|---|---|
| `VITE_EXPRESS_URL` | `http://localhost:5000` | Default Express dev server URL. Change to your Render URL after deployment. |
| `VITE_DJANGO_URL` | `http://localhost:8000` | Default Django dev server URL. Change to your Render URL after deployment. |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Same as Express URL — Socket.IO runs on the same server. |
| `VITE_APP_NAME` | `ArenaPulse` | App name used in page titles and meta tags. No setup needed. |
| `VITE_GOOGLE_CLIENT_ID` | `12345.apps.google...` | See **Google OAuth** section below. |

> **Note:** All client variables MUST start with `VITE_` or Vite won't expose them to the browser.

---

## server/.env

| Variable | Value | How to Get It |
|---|---|---|
| `PORT` | `5000` | Any open port. Default is 5000. |
| `MONGODB_URI` | `mongodb+srv://...` | See **MongoDB Atlas** section below. |
| `JWT_SECRET` | Random string | See **JWT Secret** section below. |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration. `7d` = 7 days. No setup needed. |
| `EMAIL_USER` | Gmail address | See **Gmail SMTP** section below. |
| `EMAIL_PASS` | App password | See **Gmail SMTP** section below. |
| `DJANGO_SERVICE_URL` | `http://localhost:8000` | Django dev server URL. Change after deployment. |
| `CLIENT_URL` | `http://localhost:5173` | Vite dev server URL (for CORS). Change after deployment. |
| `NODE_ENV` | `development` | Set to `production` on Render. |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | See **Cloudinary** section below. |
| `CLOUDINARY_API_KEY` | Your API key | See **Cloudinary** section below. |
| `CLOUDINARY_API_SECRET` | Your API secret | See **Cloudinary** section below. |
| `GOOGLE_CLIENT_ID` | `12345.apps.google...` | See **Google OAuth** section below. |

---

## django_service/.env

| Variable | Value | How to Get It |
|---|---|---|
| `SECRET_KEY` | Random string | See **Django Secret Key** section below. |
| `DEBUG` | `True` | Set to `False` in production. |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Add your Render domain in production. |
| `MONGODB_URI` | `mongodb+srv://...` | Same connection string as Express — shared database. |
| `EXPRESS_API_URL` | `http://localhost:5000` | Express server URL. Change after deployment. |

---

## How to Get Each Secret

### 1. MongoDB Atlas (MONGODB_URI)

This is your database. Both Express and Django connect to the same cluster.

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up (free)
2. Click **"Build a Database"** → Choose **M0 Free Tier**
3. Select any cloud provider (AWS recommended) → Choose nearest region
4. Set **cluster name** (e.g. `ArenaPulse-Cluster`)
5. Create a **database user**:
   - Go to **Security → Database Access → Add New Database User**
   - Choose **Password** authentication
   - Set a username (e.g. `arenapulse_admin`) and a strong password
   - Role: **Atlas Admin** (for dev) or **Read/Write to any database**
6. Whitelist your IP:
   - Go to **Security → Network Access → Add IP Address**
   - Click **"Allow Access from Anywhere"** (`0.0.0.0/0`) for development
7. Get connection string:
   - Go to **Deployment → Database → Connect → Drivers**
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `esports_db`

**Final format:**
```
mongodb+srv://arenapulse_admin:YOUR_PASSWORD@cluster0.abc123.mongodb.net/esports_db?retryWrites=true&w=majority
```

---

### 2. JWT Secret (JWT_SECRET)

A random string used to sign authentication tokens. Must be kept private.

**Option A — Generate in terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option B — Use any random string generator:**
- Go to [randomkeygen.com](https://randomkeygen.com/)
- Copy any "Fort Knox Password"

**Example:**
```
JWT_SECRET=a3f8c2e91b4d5a67e8f0123456789abcdef0123456789abcdef0123456789abc
```

---

### 3. Django Secret Key (SECRET_KEY)

Django uses this for cryptographic signing (sessions, CSRF tokens).

**Option A — Generate in terminal:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Option B — Generate without Django installed:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

**Example:**
```
SECRET_KEY=django-insecure-abc123xyz456def789ghi012jkl345mno678pqr901stu234
```

---

### 4. Gmail SMTP (EMAIL_USER & EMAIL_PASS)

Used by Nodemailer to send emails (registration confirmations, team invites, match results).

1. Use a **Gmail account** (create a new one for the project if you want)
2. Enable **2-Step Verification**:
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Turn on **2-Step Verification**
3. Generate an **App Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select **Mail** and **Windows Computer**
   - Click **Generate**
   - Google gives you a **16-character password** (e.g. `abcd efgh ijkl mnop`)
   - Remove the spaces → `abcdefghijklmnop`
4. Set in `.env`:

```
EMAIL_USER=your.arenapulse@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

> **Important:** This is NOT your Gmail login password. It's the App Password generated above.

---

### 5. Cloudinary (Image Uploads)

Cloudinary stores user avatars and team logos in the cloud so images don't get lost on server restart.

1. Go to [cloudinary.com](https://cloudinary.com) → **Sign up free**
2. After signup, you land on the **Dashboard**
3. You'll see three values right on the dashboard:
   - **Cloud Name** → copy it
   - **API Key** → copy it
   - **API Secret** → click the eye icon to reveal, then copy
4. Paste them in `server/.env`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

> **Free tier:** 25GB storage, 25GB bandwidth/month — more than enough for a college project.

---

### 6. Google OAuth (Google Client ID)

Used to enable "Continue with Google" one-click login and registration.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g. `ArenaPulse-Auth`)
3. Go to **APIs & Services → OAuth consent screen**
   - Choose **External** → Create
   - Fill in app name (ArenaPulse), user support email, and developer contact email. Save and Continue.
4. Go to **Credentials → Create Credentials → OAuth client ID**
5. Select **Web application**
6. Under **Authorized JavaScript origins**, click Add URI and enter: `http://localhost:5173`
7. Click **Create**
8. Copy the **Client ID** (it looks like `123456789-abcxyz.apps.googleusercontent.com`)
9. Paste it into both `client/.env` (`VITE_GOOGLE_CLIENT_ID`) and `server/.env` (`GOOGLE_CLIENT_ID`).

---

## Quick Checklist

- [ ] Created MongoDB Atlas cluster (free M0)
- [ ] Created database user with password
- [ ] Whitelisted IP (0.0.0.0/0 for dev)
- [ ] Copied MongoDB URI to both `server/.env` and `django_service/.env`
- [ ] Generated JWT secret and added to `server/.env`
- [ ] Generated Django secret key and added to `django_service/.env`
- [ ] Set up Gmail App Password and added to `server/.env`
- [ ] Created Cloudinary account and added credentials to `server/.env`
- [ ] Created Google Cloud Project, got Client ID, and added to both `client/.env` and `server/.env`
- [ ] All `.env` files are in `.gitignore` (never commit secrets!)
