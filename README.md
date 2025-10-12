<div align="center">

<img src="front-end/public/niheal_logo.png" alt="niHeal logo" width="140" />

# niHeal

**Edukasi. Deteksi. Aksi.** (Educate. Detect. Act.)

A web platform for preventing catastrophic non-communicable diseases (cancer, heart, stroke, and urology/kidney) through interactive learning, validated risk calculators, and personal test history.

[Live demo](https://niheal.vercel.app) · [Figma prototype](https://www.figma.com/proto/A9lbpJpvlauWxFDzv0TadI/Prototype-niHeal?node-id=0-1&t=dXmf9c1OLMfeyrqz-1)

</div>

---

## Background

Non-communicable diseases (NCDs) are the leading cause of death in Indonesia, and catastrophic diseases such as heart disease, cancer, and stroke place a heavy financial burden on the national health insurance system (BPJS Kesehatan). Many of them can be prevented or caught early, but public awareness of early warning signs is still low and reliable information is scattered.

niHeal brings education and self-assessment into one free, browser-based place. It was proposed for the **Study 2 Challenge 2025** hackathon (theme: *"Bridging Global Problems: Tech for a Better Tomorrow"*) and targets:

- **SDG 3:** Good Health and Well-being
- **SDG 4:** Quality Education

## Features

| Feature | Description | Status |
| --- | --- | --- |
| Accounts and profiles | Register, log in, edit your profile, upload a profile picture | Implemented |
| Heart and stroke risk test | 10-year risk estimate based on the ASCVD risk equations | Implemented |
| Cancer risk test | Risk estimate from family history, lifestyle, and related factors | Implemented |
| Kidney risk test | Kidney Failure Risk Equation (KFRE), 2-year and 5-year risk | Implemented |
| Test history | View previous results and open each past test | Implemented |
| Interactive learning | Learning materials per topic, with text, video, and quiz views | Implemented |
| Nearby hospital referral | Hospital recommendations by location and specialty | Planned |
| Charts and 3D simulations | Result charts (Chart.js) and interactive 3D lessons (Three.js) | Planned |

> The risk scores are for **education and awareness only**. They are not a medical diagnosis. Please consult a healthcare professional for any health concern.

## Tech stack

**Front end** (`front-end/`)
- Next.js 15 (App Router, Turbopack) and React 19
- Tailwind CSS 4, TypeScript and JavaScript
- React Icons

**Back end** (`back-end/`)
- Node.js and Express 5
- Passport (local strategy) with `express-session`, passwords hashed with `bcrypt`
- `multer` for profile image uploads
- PostgreSQL via `pg`

**Hosting:** Vercel (front end) and Railway (back end, see `railway.toml`).

## Project structure

```
niheal/
├── back-end/
│   ├── server.js            # Express app and all API routes
│   ├── dbConfig.js          # PostgreSQL connection pool (reads .env)
│   ├── passportConfig.js    # Local auth strategy
│   ├── ascvd_calc.js        # Heart and stroke risk calculation
│   ├── cancer_calc.js       # Cancer risk calculation
│   ├── kfre_calc.js         # Kidney failure risk calculation
│   └── uploads/             # Uploaded profile images
├── front-end/
│   ├── public/              # Logo and images
│   └── src/
│       ├── app/             # Pages: login, register, dashboard, profile, tests, learning
│       └── lib/             # API client and learning helpers
├── dbSetup.sql              # Schema and seed data (risk tests and coefficients)
├── railway.toml             # Back-end deployment config
└── package.json             # Root script that runs both servers
```

## Getting started

### Prerequisites

- Node.js 18 or newer and npm 9 or newer
- PostgreSQL 14 or newer, with the `psql` CLI

### 1. Clone and install

```bash
git clone https://github.com/britoddd/niheal.git
cd niheal

npm install
npm install --prefix back-end
npm install --prefix front-end
```

### 2. Set up the database

Create a database and a dedicated user. Choose your own strong password; **never reuse a real one from another service**.

```bash
psql -U postgres
```

```sql
CREATE USER niheal_user WITH PASSWORD '<choose-a-strong-password>' CREATEDB;
CREATE DATABASE niheal OWNER niheal_user;
\q
```

Then load the schema and seed data:

```bash
psql -U niheal_user -d niheal -f dbSetup.sql
```

### 3. Configure environment variables

Create `back-end/.env` (it is already covered by `.gitignore`; **never commit it**).

```env
# Option A: a single connection string
# DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>

# Option B: separate settings (used when DATABASE_URL is not set)
DB_USER=niheal_user
DB_PASSWORD=<your-database-password>
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=niheal

# Set to true for managed databases that require SSL
# (SSL is always enabled when NODE_ENV=production)
DB_SSL=false

# Optional
# PORT=4000
```

For the front end, create `front-end/.env.local` only if your API is not at the default address:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | back end | Full PostgreSQL connection string (takes priority) |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_DATABASE` | back end | Discrete connection settings |
| `DB_SSL` | back end | Force SSL for the database connection |
| `PORT` | back end | API port (default `4000`) |
| `NODE_ENV` | both | `production` enables SSL and secure cross-site cookies |
| `NEXT_PUBLIC_API_URL` | front end | Base URL of the API (default `http://localhost:4000`) |

### 4. Run in development

From the project root, start both servers together:

```bash
npm run dev
```

- Front end: http://localhost:3000
- Back end API: http://localhost:4000

Check that the API is up:

```bash
curl http://localhost:4000/api/
```

## API overview

All routes are prefixed with `/api`. Routes marked 🔒 require a logged-in session.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `POST` | `/register` | Create an account |
| `POST` | `/login` | Log in |
| `POST` | `/logout` | Log out |
| `GET` | `/user` 🔒 | Current user |
| `GET` / `PUT` | `/profile` 🔒 | Read or update the profile |
| `POST` | `/profile/picture` 🔒 | Upload a profile picture (served from `/uploads`) |
| `GET` | `/risk-tests` 🔒 | List available risk tests |
| `GET` | `/risk-tests/:id` 🔒 | Details of one risk test |
| `POST` | `/calculate-ascvd` 🔒 | Heart and stroke risk |
| `POST` | `/calculate-cancer` 🔒 | Cancer risk |
| `POST` | `/calculate-kfre` 🔒 | Kidney failure risk |
| `GET` | `/test-history` 🔒 | Past test results |
| `GET` | `/learning` 🔒 | List learning materials |
| `GET` | `/learning/:slug` 🔒 | One learning material |

## Deployment notes

- Run the front end with `npm run build --prefix front-end` and `npm run start --prefix front-end`, or deploy it on Vercel.
- Set `NODE_ENV=production` for the back end so cookies are `secure` and cross-site capable, and serve the API over HTTPS.
- Add your deployed front-end origin to the CORS allow-list in `back-end/server.js`.
- Provide all secrets through your hosting provider's environment settings, not through files in the repository.

## Security

- Never commit `.env` files, connection strings, API keys, or passwords.
- If a credential is ever committed, **rotate it immediately**. Deleting it in a later commit does not remove it from git history.
- Use a strong, unique password for the database user, and a strong random secret for sessions.

## Team

Built by **Ad Maiorem Dei Gloriam** for the Study 2 Challenge 2025:

- Michaela Jonea (Soegijapranata Catholic University)
- Jonathan Vincent Hartono (Soegijapranata Catholic University)
- Brian Nicholas Tedjo (Bina Nusantara University @Semarang)

## Disclaimer

niHeal provides general health education and risk estimates based on published clinical tools. It does not replace professional medical advice, diagnosis, or treatment.