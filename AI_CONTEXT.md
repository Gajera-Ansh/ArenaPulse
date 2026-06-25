You are helping me build ArenaPulse — a full-stack Esports Tournament Platform.
This is a Semester IV combined project covering two courses simultaneously:
FSD-2 (Full Stack Development with JavaScript-2) and FCSP-2 (Fundamentals of
Computer Science using Python-2) at Lok Jagruti University, Ahmedabad.

---

WHAT THE PLATFORM DOES

ArenaPulse is a web platform where:
- Players register accounts, form teams, and join tournaments
- Tournament Organizers create and manage tournaments, approve teams,
  schedule matches, and enter live scores
- Admins manage the entire platform — users, tournaments, disputes, analytics
- Brackets generate automatically after registration closes
- Match scores update in real time for all viewers via Socket.IO
- A Python/Django service handles data analytics, ML predictions, and charts
- Three AI/ML models run on the Python side:
  1. Win probability predictor (Random Forest / kNN)
  2. Player tier classifier — Bronze/Silver/Gold/Elite (Keras neural network)
  3. AI match summary generator (text from match stats)

---

ARCHITECTURE

This is a monorepo with three services:

arenapulse/
├── client/          React (Vite) frontend — talks to both backends
├── server/          Express + Node.js — main operational API
└── django_service/  Django + DRF — analytics and AI service

The React frontend is the single interface. It calls Express for all
operational tasks and Django for analytics, charts, and ML predictions.
Users never see two backends — it appears as one unified platform.

---

TECH STACK

client/:
- React 18 (Vite)
- React Router v6
- Axios
- Tailwind CSS
- Socket.IO client
- Context API (AuthContext, TeamContext)

server/:
- Node.js
- Express.js
- MongoDB Atlas (Mongoose ORM)
- Socket.IO
- JWT (jsonwebtoken) + bcrypt
- Multer (file uploads)
- Nodemailer (emails)
- qrcode (QR generation)

django_service/:
- Django 4
- Django REST Framework
- djangorestframework-simplejwt
- Pandas
- Seaborn
- Plotly + Dash
- NetworkX
- scikit-learn (Random Forest, kNN, SVM, Decision Tree)
- TensorFlow / Keras
- BeautifulSoup4 + requests
- SQLite (for Django admin / ORM demo)
- pymongo (to read MongoDB data for analytics)

Deployment:
- React → Vercel
- Express → Render
- Django → Render
- MongoDB → MongoDB Atlas (free M0)

---

DATABASE

One MongoDB Atlas cluster, one database called esports_db.

Collections:
- users         — name, email, password (hashed), role, avatar, banned
- teams         — name, tag, game, captain (ref User), players[], logo
- tournaments   — title, game, organizer, bracketType, dates, prizePool, status, rules
- matches       — tournament, teamA, teamB, scoreA, scoreB, winner, round, status
- registrations — team, tournament, status (pending/approved/rejected), note
- notifications — user, message, type, read
- checkins      — match, player, qrCode, verified

Django uses SQLite separately only for Django ORM / admin panel demonstration.

---

USER ROLES AND WHAT THEY CAN DO

PLAYER:
- Register and login
- Create a team (becomes Captain) or join one via invite
- Search players by username and send team invites
- Accept or decline incoming invites
- Register team for a tournament (Captain only)
- View live bracket and real-time scores
- QR check-in before matches
- Vote for MVP after matches
- Raise result disputes (Captain only)
- View personal stats, tier badge, win probability, achievement badges

TOURNAMENT ORGANIZER:
- Create tournaments with rules, bracket type, prize pool, schedule
- Approve or reject team registration applications
- Lock registrations and generate bracket automatically
- Schedule match timeslots
- Scan QR codes to verify player check-ins
- Enter live scores (triggers Socket.IO update to all viewers)
- Submit final results, resolve disputes
- Generate AI match summary after each result
- Send announcement emails to all registered teams
- View full analytics dashboard for their tournaments

ADMIN:
- View and manage all users — ban, unban, change role
- View and manage all tournaments across all organizers
- Override any match result (dispute resolution)
- Feature tournaments on the homepage
- View platform-wide analytics
- Access Django admin panel for ORM-level control
- Configure platform settings

---

COMPLETE USER WORKFLOW

1. Player registers → logs in → creates team → invites players
2. Organizer creates tournament → publishes it
3. Captain sees tournament → submits team application
4. Organizer reviews applications → approves or rejects with reason
5. Captain and all team members get email notification on decision
6. After deadline → Organizer locks registrations
7. Python bracket engine generates bracket → sent back to React via DRF API
8. Organizer schedules match timeslots
9. On match day → players scan QR codes to check in
10. Match goes live → Organizer enters scores in real time
11. Socket.IO emits match:result event → all viewers see update instantly
12. Winner auto-advances in bracket
13. Players vote for MVP → achievement badges awarded
14. After tournament → Django analytics pipeline runs on match data
15. Organizer views Pandas EDA, Seaborn charts, Plotly dashboard, ML insights

---

FOLDER STRUCTURE

client/src/
  main.jsx, App.jsx
  context/        AuthContext.jsx, TeamContext.jsx
  api/            expressApi.js, djangoApi.js, socketClient.js
  hooks/          useAuth.js, useSocket.js, useTournament.js
  utils/          formatDate.js, bracketUtils.js, validators.js
  components/
    common/       Navbar, Footer, ProtectedRoute, LoadingSpinner,
                  NotificationBell, AvatarUpload
    tournament/   BracketView, TournamentCard, MatchCard,
                  LiveScore, CountdownTimer
    team/         TeamCard, PlayerRow, InviteSearch
    charts/       PlotlyEmbed, SeabornImage
  pages/
    public/       Home, TournamentList, TournamentDetail, Leaderboard
    auth/         Register, Login, Profile
    player/       Dashboard, TeamManagement, PlayerStats, QRCheckin
    organizer/    CreateTournament, ManageTournament, TournamentAnalytics
    admin/        AdminDashboard, UserManagement, MatchOversight

server/
  server.js
  config/         db.js, socket.js
  models/         User, Team, Tournament, Match, Registration,
                  Notification, Checkin
  routes/         auth, user, team, tournament, registration,
                  match, checkin, leaderboard, notification, admin
  controllers/    auth, user, team, tournament, match, registration,
                  checkin, leaderboard, admin, email
  middleware/     auth.middleware, role.middleware,
                  upload.middleware, errorHandler
  utils/          bracketGenerator.js, jwtHelper.js, emailTemplates.js

django_service/
  arenapulse_django/   settings.py, urls.py, wsgi.py
  analytics/           models, serializers, views, urls, admin
    pandas_analysis/   match_eda.py, leaderboard.py, cross_tabulation.py
    visualizations/    seaborn_charts.py, plotly_charts.py, networkx_graph.py
  ml_service/          models, serializers, views, urls
    preprocessing/     feature_engineering.py, encode_categoricals.py
    training/          train_win_predictor.py, train_player_classifier.py,
                       evaluate_models.py
    trained_models/    win_predictor.pkl, player_classifier.h5
  scraper/             bs4_scraper.py, api_ingestion.py, views.py, urls.py
  dash_app/            app.py, layouts.py, callbacks.py
  data/                match_results.csv, player_stats.csv

---

PAGES (19 total)

Public (no login):
  / .................. Home — hero, live stats, featured tournaments
  /tournaments ........ Browse all tournaments with filters
  /tournaments/:id .... Full detail — rules, bracket, live scores
  /leaderboard ........ Global team and player rankings

Auth:
  /register ........... Create account, choose role
  /login .............. JWT login
  /profile ............ Edit avatar, password, notification prefs

Player:
  /dashboard .......... Personal overview — team, matches, stats
  /team ............... Create/manage team, invite players
  /stats .............. Personal performance charts + ML tier badge
  /checkin ............ QR code display for match day

Organizer:
  /organizer/create ............. Multi-step tournament creation wizard
  /organizer/tournaments/:id .... Approve teams, enter scores, send emails
  /organizer/analytics/:id ...... Seaborn + Plotly charts from Django

Admin:
  /admin ................. Platform metrics dashboard
  /admin/users ........... Ban/unban/promote users
  /admin/matches ......... Live match oversight + result override

Python/Django:
  Django admin panel ..... ORM-level control (FCSP Units 8-9)
  Dash analytics app ..... Full Plotly/Seaborn/NetworkX dashboard
  ML prediction panel .... Win probability, tier classifier, match summary

---

REAL-TIME FLOW (Socket.IO)

Server emits to tournament room when organizer submits score:
  io.to(`tournament-${id}`).emit('match:result', { matchId, scoreA, scoreB, winner })

Client listens in useEffect:
  socket.on('match:result', (data) => update bracket and scoreboard)

Socket rooms are per tournament so updates are isolated.

---

PYTHON / ML DETAILS

Win predictor:
  Input:  avg K/D, win streak, recent form (last 5), head-to-head record
  Output: win probability % for each team
  Model:  Random Forest (primary), kNN and SVM for comparison
  Eval:   confusion matrix, accuracy, sensitivity, specificity

Player tier classifier:
  Input:  total wins, K/D ratio, tournaments played, MVP votes
  Output: Bronze / Silver / Gold / Elite
  Model:  Keras Sequential — Dense layers, ReLU hidden, Softmax output

Match summary generator:
  Input:  scoreA, scoreB, top fragger stats, MVP votes, round-by-round data
  Output: 2-3 sentence readable match summary paragraph
  Method: structured prompt sent to AI API with match stats as context

Analytics pipeline (Pandas + visualization):
  - groupby() wins per team, describe() for summary stats
  - value_counts() on game types, corr() on performance metrics
  - Seaborn: heatmap (win rate by game × round), boxplot (match duration)
  - Plotly: interactive team performance line chart
  - NetworkX: team-player relationship graph
  - Dash: full dashboard with dropdowns and filters
  - Outlier detection: z-score on K/D ratio

Web scraping (BeautifulSoup):
  - Scrape public esports game rankings
  - Handle pagination, headers, rate limiting
  - Store results as CSV → feed into Pandas pipeline

---

ENVIRONMENT VARIABLES

client/.env:
  VITE_EXPRESS_URL=http://localhost:5000
  VITE_DJANGO_URL=http://localhost:8000

server/.env:
  PORT=5000
  MONGODB_URI=mongodb+srv://...
  JWT_SECRET=your_secret_key
  EMAIL_USER=your@gmail.com
  EMAIL_PASS=your_app_password

django_service/.env:
  SECRET_KEY=your_django_secret
  DEBUG=True
  ALLOWED_HOSTS=localhost,127.0.0.1
  MONGODB_URI=mongodb+srv://...
  EXPRESS_API_URL=http://localhost:5000

---

SYLLABUS MAPPING

FSD-2 units covered:
  Unit 1  → JSON API contract, all Axios responses
  Unit 2  → Node.js event loop, Socket.IO (built on EventEmitter)
  Unit 3  → HTTP server, routing, serving files
  Unit 4  → Express routing, middleware, app.use()
  Unit 5  → Cookies, sessions, RESTful API design, CORS
  Unit 6  → Multer file upload, Nodemailer emails, EJS
  Unit 7  → React components, JSX, React Router, props
  Unit 8  → useState, useEffect, useReducer, useContext, Axios, forms
  Unit 9  → MongoDB queries, operators, aggregation pipeline
  Unit 10 → Mongoose schemas, CRUD, indexing, MERN integration

FCSP-2 units covered:
  Unit 1  → Pandas EDA on match data (groupby, describe, outliers, cross tab)
  Unit 2  → Seaborn, Plotly, Dash, NetworkX visualizations
  Unit 3  → ML preprocessing, feature engineering, train-test split
  Unit 4  → Regression on prize pool prediction (R², MAE, MSE)
  Unit 5  → kNN, Random Forest, SVM, Decision Tree, confusion matrix
  Unit 6  → Keras neural network, CNN basics, Transfer Learning
  Unit 7  → BeautifulSoup scraping, REST API ingestion, pagination
  Unit 8  → Django setup, MVT architecture, ORM, migrations
  Unit 9  → Django forms, CSRF, user auth, CRUD, Django admin
  Unit 10 → DRF serializers, viewsets, JWT, Postman testing

---

CODING RULES

- ES modules (import/export) in client and server — no CommonJS require()
- async/await everywhere — no .then() chains, no callbacks
- All Express routes protected by auth.middleware and role.middleware
- Socket.IO score emit happens inside match controller after DB save
- Django views use ViewSet or @api_view — no plain Django views
- All env vars via process.env (Node) and os.environ (Python)
- MongoDB ObjectId refs used for all relationships between collections
- Consistent error format: { success: false, message: "..." }
- Consistent success format: { success: true, data: {...} }
- No hardcoded URLs — always read from environment variables

---

When I ask you to build a specific file or feature, always follow
this project context. Never suggest a different tech stack, never
simplify the architecture, and never remove features. If something
is unclear, ask before writing code.