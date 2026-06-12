# CareerDock V2 — Complete Rebuild Spec (for Claude Code)

> **IMPORTANT: Delete all existing frontend code and start fresh. Keep the project name "CareerDock", the CD monogram logo, and the tagline "Track every application. Miss nothing." Everything else is rebuilt from scratch.**

> **Backend: Node.js + Express + MySQL. Frontend: React + Vite. The MySQL database needs to be redesigned — drop old tables and create new ones per the schema below.**

---

## 0. UI PHILOSOPHY — MAKE IT PREMIUM

This is NOT a basic student project UI. Make it **world-class, premium, glassmorphism-inspired**.

### UI requirements (apply EVERYWHERE):
- **Glassmorphism cards**: `background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); border-radius: 16px;`
- **Subtle shadows**: `box-shadow: 0 8px 32px rgba(0,0,0,0.08);`
- **Smooth animations on EVERYTHING**: hover scales (1.02), page transitions (fade-in 0.3s), card entrance animations (slide-up with stagger), button hover glows, sidebar hover highlights
- **Micro-interactions**: checkboxes animate, toggles slide, cards flip on certain actions, progress bars animate on load, numbers count up on dashboard
- **Gradient accents**: subtle gradients on buttons, header areas, and active states (use theme colors)
- **Rounded everything**: buttons 12px, cards 16px, inputs 10px, avatars fully round
- **Typography**: clean sans-serif (Inter or system font), big bold headings (28-32px), generous line-height, proper hierarchy
- **Generous whitespace**: don't cramp elements, let them breathe
- **Hover states on every interactive element**: color shift, subtle scale, glow effect
- **Loading skeletons**: show shimmer/skeleton loaders instead of blank screens when data loads
- **Toast notifications**: animated slide-in toasts for success/error messages (top-right)
- **Empty states**: beautiful illustrated empty states with a message and CTA when no data exists (e.g. "No applications yet — add your first one!")
- **Responsive**: works on desktop AND mobile (sidebar collapses to hamburger on mobile)

---

## 1. THEME SYSTEM (implement first — everything depends on it)

Use CSS variables on `:root` controlled by a `data-theme` attribute on `<html>`. Store in localStorage. Create a `ThemeContext` in React.

### 7 Themes:

```
1. SAGE (default):
   --sidebar: #3D5435; --primary: #4A6741; --accent: #99AD7A;
   --surface: rgba(238,232,212,0.6); --mainBg: #FAF8F2; --text: #2A3D24;
   --cardBg: rgba(255,255,255,0.6); --muted: #7A8A6A;

2. BLUSH (pink):
   --sidebar: #5C3A45; --primary: #C2185B; --accent: #F48FB1;
   --surface: rgba(252,228,236,0.6); --mainBg: #FFF5F8; --text: #3D1F28;
   --cardBg: rgba(255,255,255,0.6); --muted: #9A7080;

3. OCEAN (blue):
   --sidebar: #1A2F4A; --primary: #1565C0; --accent: #64B5F6;
   --surface: rgba(212,230,248,0.6); --mainBg: #F5F9FF; --text: #0D1B2A;
   --cardBg: rgba(255,255,255,0.6); --muted: #5A7A9A;

4. LAVENDER (purple):
   --sidebar: #2D2442; --primary: #7B1FA2; --accent: #CE93D8;
   --surface: rgba(232,224,248,0.6); --mainBg: #FAF5FF; --text: #1A1030;
   --cardBg: rgba(255,255,255,0.6); --muted: #7A6A90;

5. SAND (beige/warm):
   --sidebar: #3A2A1A; --primary: #8B6348; --accent: #D4A882;
   --surface: rgba(242,232,216,0.6); --mainBg: #FBF7F0; --text: #2E1A0E;
   --cardBg: rgba(255,255,255,0.6); --muted: #8A7A6A;

6. MIDNIGHT (dark blue — cool):
   --sidebar: #0F1923; --primary: #00BCD4; --accent: #4DD0E1;
   --surface: rgba(20,40,60,0.6); --mainBg: #0A1628; --text: #E0F0FF;
   --cardBg: rgba(30,50,70,0.5); --muted: #6A8A9A;

7. ROSE GOLD (elegant):
   --sidebar: #3D2A2A; --primary: #C07A5C; --accent: #E8B4A0;
   --surface: rgba(248,232,224,0.6); --mainBg: #FDF8F5; --text: #2A1A15;
   --cardBg: rgba(255,255,255,0.6); --muted: #9A7A70;
```

### Dark mode:
For each theme, provide a dark variant. Keep accent colors, but:
- `--mainBg` → deep dark toned to theme (~#0F0F12 for neutral, or tinted)
- `--surface` → slightly lighter dark with transparency
- `--cardBg` → `rgba(30,30,35,0.6)` with backdrop blur
- `--text` → near white
- `--sidebar` stays deep themed

---

## 2. SIDEBAR (global shell)

Fixed left sidebar (~240px), background `var(--sidebar)`.

### Top:
- CD monogram circle (accent color border + text) + "**Career**Dock" wordmark ("Career" in white/cream, "Dock" in accent).
- Tagline: "Track every application. Miss nothing." in small muted text.

### Nav items (with icons — use react-icons or lucide-react):
```
MAIN
  📊 Dashboard
  📋 Applications
  🎯 Tracker

WORKSPACE
  📄 Resumes
  💬 AI Chat
  📅 Planner

(bottom, margin-top auto)
  ⚙️ Account / Settings
```

### Active state: glassmorphism pill with accent background glow. Hover: subtle highlight. Each item has an icon + label. Smooth transition on active switch.

### Bottom: User avatar (circle with initial letter, gradient background using theme accent) + name + email. Clicking opens Account section.

### Mobile: sidebar collapses to a hamburger menu icon. Overlay sidebar slides in.

---

## 3. Section 1 — APPLICATIONS

**Purpose: Store all applied applications. No rounds here — just the applications themselves.**

### Add Application form (modal with glassmorphism):
- Company Name (text input, required)
- Role (text input — e.g. "SDE Intern")
- Package LPA (number input)
- Location (text input)
- Tech Stack (tag input — user types and adds multiple tags like "React", "Java", "MySQL")
- JD — **three options**:
  1. Copy-paste JD text into a textarea
  2. Upload a PDF/file from device (phone or laptop)
  3. Leave blank for now
- Applied Date (date picker, default today)

### Application List View:
- Beautiful glassmorphism cards in a grid layout (2-3 columns on desktop, 1 on mobile).
- Each card shows: Company name (bold), Role, Package, Location, Tech Stack (as small pills/tags), Applied date.
- **Important marker**: ★ toggle on each card. Important ones get a subtle glowing border in accent color.
- **Search bar** at top — searches across company name, role, tech stack.
- **Filter options** (chips or dropdown): filter by Tech Stack, Package range, Role, Location.
- Sorting: by date (newest first default), by package, alphabetical.
- Click a card → view full details including JD.
- Edit and Delete options on each card.

### API:
```
POST   /api/applications       — create (supports file upload for JD)
GET    /api/applications       — list all for user (supports ?search=, ?tech=, ?role=, ?minPkg=, ?maxPkg=)
GET    /api/applications/:id   — get one with full details
PUT    /api/applications/:id   — update
DELETE /api/applications/:id   — delete
PATCH  /api/applications/:id/important — toggle important
```

---

## 4. Section 2 — TRACKER (⭐ the most important and unique section)

**Purpose: Each applied company becomes a trackable "card diary" where the user manages rounds, notes, company info, and everything about that company's hiring process.**

### How it works:
- Fetches all companies from the Applications section automatically.
- Each company is displayed as a **big, beautiful card** — think of it as a "diary page" for that company.
- Cards are arranged in a masonry or grid layout, nicely organized.

### Each Company Card contains 5 tabs/sections (use tabs or accordion inside the card, or expand to full page on click):

**Tab 1 — Rounds:**
- List of rounds for this company (user adds them).
- Each round has: Round Number (auto), Category (dropdown: Screening, OA, Interview, HR, Technical, Group Discussion, **Other** — if user picks "Other" they can type a custom category name), Scheduled Date/Time, Status (Upcoming / Completed / Passed / Failed), Notes for this specific round.
- "+ Add Round" button.
- Visual timeline/progress bar showing round progression.

**Tab 2 — Notes (VERY IMPORTANT):**
- A rich notepad area specifically for this company.
- User can write anything — questions asked, tech stack discussed, mistakes made, tips, key points.
- Support basic formatting (bold, bullet points, headings) — use a simple rich text editor or markdown.
- Notes auto-save.
- This is like a personal diary entry per company.

**Tab 3 — JD & Tech Stack:**
- Auto-pulled from the Application section.
- Show the JD text or uploaded file.
- Show tech stack as tags.
- User can edit/update here too.

**Tab 4 — Company Info (AI-powered):**
- Uses **Gemini API or OpenAI API** to fetch and display:
  - Company domain/industry
  - Key products and services
  - Company culture highlights
  - Common HR questions for this company
  - Recent news (optional)
- This helps user prep for HR rounds directly from the tracker.
- Show a "Refresh Info" button to re-fetch.
- Cache the info in the database so it doesn't call the API every time.

**Tab 5 — Status & Details:**
- Overall status of this company: Applied → In Process → Offered / Rejected
- Package, Role, Location (from application)
- Important marker toggle

### Card Color Coding (based on theme):
- **Cracked/Offered** → card gets a green-tinted glassmorphism (green border glow, subtle green tint)
- **Rejected** → card gets a red-tinted glassmorphism (red border, subtle red tint)
- **Neutral / In Progress** → uses the current theme's accent color

### Other Tracker features:
- **Important marker (★)** — important companies sort to the top with a glow effect.
- **Search** across all company cards.
- **Filter** by status (All / In Process / Offered / Rejected).
- **Notifications/Reminders**: when a round's scheduled_at is approaching (within 2 days), show a badge/notification on the tracker icon in sidebar + a toast notification on dashboard. Also update the Planner calendar.
- **Calendar integration**: all round dates automatically show up in the Planner calendar.

### API:
```
GET    /api/tracker                    — list all tracked companies (joins with applications)
GET    /api/tracker/:appId             — get full tracker data for one company

POST   /api/rounds                     — add a round
PUT    /api/rounds/:id                 — update round
DELETE /api/rounds/:id                 — delete round
GET    /api/rounds/application/:appId  — get rounds for an application

POST   /api/tracker-notes              — save/update notes for a company
GET    /api/tracker-notes/:appId       — get notes for a company

GET    /api/company-info/:appId        — get AI-generated company info (calls Gemini/OpenAI, caches result)
POST   /api/company-info/:appId/refresh — re-fetch company info from AI

PATCH  /api/applications/:id/status    — update overall status (offered/rejected/in-process)
```

---

## 5. Section 3 — RESUMES

**Purpose: Upload, manage, edit, and analyze multiple resumes.**

### Features:

**1. Upload Resume:**
- Upload from device only (NO copy-paste) — accept PDF, DOC, DOCX.
- File upload via `multer` on backend, store file path.
- User gives each resume a version name (e.g. "SDE Resume v2", "Frontend Resume").

**2. Resume List:**
- Show all uploaded resumes as cards — version name, upload date, file type icon.
- Mark one as "Active" (primary resume).
- Download, Delete options on each.

**3. ATS Score Calculator:**
- User selects a resume + pastes/selects a JD (or picks a company from their applications).
- Backend extracts text from resume PDF (use `pdf-parse` npm), tokenizes both resume and JD.
- Compute: match percentage, matched keywords (green chips), missing keywords (red chips).
- Display as a big animated circular progress bar + keyword lists.

**4. AI Suggestions & Spell Check:**
- Send resume text to Gemini/OpenAI API.
- Get back: improvement suggestions, missing sections, spell corrections, better phrasing.
- Display as a list of actionable suggestions.

**5. Resume Editor:**
- A basic in-browser resume editor (can be a rich text editor pre-filled with extracted resume content).
- User edits → exports as PDF (use `jspdf` or `react-pdf` on frontend).
- Saves the edited version as a new resume entry.

### API:
```
POST   /api/resumes/upload         — upload resume file (multer)
GET    /api/resumes                — list all for user
GET    /api/resumes/:id            — get one
DELETE /api/resumes/:id            — delete
PATCH  /api/resumes/:id/active     — set as active resume

POST   /api/resumes/ats-score      — body: {resumeId, jdText or applicationId} → returns score + keywords
POST   /api/resumes/ai-suggestions — body: {resumeId} → returns AI suggestions
```

---

## 6. Section 4 — AI CHAT (Personal Chatbox)

**Purpose: A full ChatGPT-like chatbot inside CareerDock where user can ask anything about placement prep.**

### Features:
- Full chat interface — message bubbles, user on right, AI on left.
- Uses **Gemini API or OpenAI API** for responses.
- System prompt: "You are CareerDock AI, a helpful placement preparation assistant. Help the user with interview prep, DSA concepts, HR questions, company research, resume tips, and general career advice."
- Chat history stored in database per user (so conversations persist across sessions).
- "New Chat" button to start fresh.
- Chat list sidebar (like ChatGPT) showing previous conversations.
- Typing indicator animation while AI responds.
- Markdown rendering in AI responses (for code blocks, lists, etc.).
- Beautiful glassmorphism chat bubbles.

### API:
```
POST   /api/chat                — send message, get AI response
GET    /api/chat/conversations  — list user's conversations
GET    /api/chat/:convId        — get messages in a conversation
POST   /api/chat/new            — start new conversation
DELETE /api/chat/:convId        — delete a conversation
```

---

## 7. Section 5 — PLANNER

**Purpose: Calendar + Task manager + LeetCode/GitHub integration + Daily planning.**

### Sub-sections:

**1. Calendar:**
- Monthly calendar view.
- Auto-populated with round dates from Tracker (colored dots on dates).
- User can also manually add events.
- Click a date to see all events/tasks for that day.
- Today highlighted.

**2. Tasks / To-Do:**
- Three columns/tabs:
  1. **To Do** — pending tasks
  2. **Completed** — done tasks (checked off)
  3. **Not Done / Missed** — tasks past due date that weren't completed
- Each task: title, description, category (DSA / Application / Resume / Interview / Other), priority (Low/Medium/High with color coding), due date.
- "+ Add Task" button.
- Mark done → moves to Completed with a satisfying animation.
- **"Reset All" button** — clears all tasks so user can plan fresh daily.
- **Delete individual tasks** option.
- Category filter chips.

**3. LeetCode Integration:**
- User connects their LeetCode username.
- Fetch solved problems via LeetCode API/scraping (use `leetcode-query` npm or direct GraphQL).
- Display: total solved, easy/medium/hard breakdown, list of all solved questions.
- **Personal notepad per question** — user can write revision notes for each solved problem.
- Search and filter solved questions.

**4. GitHub Integration:**
- User enters GitHub username.
- Fetch all public repos via GitHub API.
- Display: repo name, description, language, stars, last updated.
- User can see all their projects in one place.

**5. Reminders/Notifications:**
- Tasks approaching due date → show notification badge on Planner in sidebar.
- Toast notifications for upcoming deadlines.

### API:
```
POST   /api/tasks              — create task
GET    /api/tasks              — list all (supports ?status=todo/done/missed, ?category=)
PUT    /api/tasks/:id          — update
DELETE /api/tasks/:id          — delete
PATCH  /api/tasks/:id/toggle   — toggle done
DELETE /api/tasks/reset         — reset all tasks for user

GET    /api/planner/calendar/:month/:year — get all events for a month (rounds + manual events)
POST   /api/planner/events     — add manual calendar event

GET    /api/integrations/leetcode/:username  — fetch LeetCode stats + solved list
POST   /api/integrations/leetcode/notes      — save note for a question
GET    /api/integrations/leetcode/notes      — get all notes

GET    /api/integrations/github/:username    — fetch GitHub repos
```

---

## 8. Section 6 — DASHBOARD

**Purpose: Overview of everything + streak system.**

### Layout:

**Top greeting**: "Good morning, Reeya 🌿" + "Here's your placement overview" (greeting changes by time of day).

**Stat cards row** (animated count-up numbers on load):
- Total Applications
- In Interview
- Offers
- Rejections
- Rounds Completed
- Pending Tasks

**Streak Section (UNIQUE FEATURE):**
- Track how many consecutive days the user has been active (checked off tasks or used the planner).
- Big animated streak counter: "🔥 5 Day Streak!"
- Motivational messages that change per milestone:
  - 1 day: "Great start! Keep it up!"
  - 5 days: "You're on fire! 5 days strong! 🔥"
  - 10 days: "Double digits! Unstoppable! 💪"
  - 25 days: "25 days! You're a placement machine! 🚀"
  - 50 days: "🏆 50 DAY BADGE UNLOCKED! You're a legend!"
  - 100 days: "💎 100 DAY BADGE UNLOCKED! Absolute champion!"
- Badges displayed as shiny icons on dashboard (earned badges stay permanently).
- Streak resets if user misses a day.

**Two-column layout below:**
- Left: **Upcoming Rounds** (next 7 days, from Tracker) with countdown "in 2 days".
- Right: **Recent Activity** — last 5 actions (added application, completed round, etc.).

**Bottom row:**
- Quick links: "Add Application", "Start Chat", "View Calendar".

### API:
```
GET /api/dashboard/stats      — all counts
GET /api/dashboard/streak     — current streak + badges earned
POST /api/dashboard/checkin   — mark today as active (called when user does any action)
GET /api/dashboard/upcoming   — upcoming rounds in next 7 days
GET /api/dashboard/activity   — recent activity log
```

---

## 9. Section 7 — ACCOUNT / SETTINGS

Accessed from sidebar bottom or a dedicated page.

### Features:

**1. Profile:**
- Show name, email, phone.
- Edit profile (change name, phone).
- Change password.

**2. Theme Selection:**
- Show 7 theme swatches as beautiful colored circles/cards.
- Click to apply instantly (live preview).
- Current theme has a checkmark + glow.

**3. Dark / Light Mode:**
- Toggle switch with sun/moon icon.
- Applies instantly.

**4. Switch Account:**
- Logs out and goes to login page.
- Login page has "Add another account" option (just means register/login with different credentials).

**5. Subscription (placeholder for v1):**
- Show "Free Plan" with features list.
- "Upgrade to Pro" button (just a placeholder/coming soon).

**6. Logout:**
- Clears token, redirects to login.

---

## 10. REVISED MySQL SCHEMA

**Drop all existing tables first**, then create these:

```sql
DROP DATABASE IF EXISTS careerdock_db;
CREATE DATABASE careerdock_db;
USE careerdock_db;

-- Users
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#4A6741',
  theme VARCHAR(20) DEFAULT 'sage',
  dark_mode BOOLEAN DEFAULT FALSE,
  streak_count INT DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badges earned by users
CREATE TABLE badges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications
CREATE TABLE applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  role VARCHAR(100),
  package_lpa DECIMAL(6,2),
  location VARCHAR(150),
  tech_stack JSON,
  jd_text TEXT,
  jd_file_url VARCHAR(500),
  applied_date DATE DEFAULT (CURRENT_DATE),
  overall_status ENUM('applied','in-process','offered','rejected') DEFAULT 'applied',
  is_important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rounds (linked to applications)
CREATE TABLE rounds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT NOT NULL,
  round_number INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  scheduled_at DATETIME,
  status ENUM('upcoming','completed','passed','failed') DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Company notes (one big notepad per company/application in tracker)
CREATE TABLE tracker_notes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  content LONGTEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Company info cache (AI-generated)
CREATE TABLE company_info (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT NOT NULL,
  info_json LONGTEXT,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Resumes
CREATE TABLE resumes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  version_name VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(20),
  is_active BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ATS Scores
CREATE TABLE ats_scores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  resume_id BIGINT NOT NULL,
  application_id BIGINT,
  jd_text TEXT,
  score INT,
  matched_keywords JSON,
  missing_keywords JSON,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
);

-- Tasks
CREATE TABLE tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category ENUM('dsa','application','resume','interview','other') DEFAULT 'other',
  priority ENUM('low','medium','high') DEFAULT 'medium',
  due_date DATETIME,
  status ENUM('todo','done','missed') DEFAULT 'todo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Calendar events (manual + auto from rounds)
CREATE TABLE calendar_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  source ENUM('manual','tracker') DEFAULT 'manual',
  source_id BIGINT,
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat conversations
CREATE TABLE chat_conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) DEFAULT 'New Chat',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat messages
CREATE TABLE chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  content LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

-- LeetCode notes (per question)
CREATE TABLE leetcode_notes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  question_id VARCHAR(50),
  question_title VARCHAR(300),
  difficulty VARCHAR(20),
  note_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User integrations (LeetCode username, GitHub username)
CREATE TABLE integrations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  platform ENUM('leetcode','github','codeforces') NOT NULL,
  username VARCHAR(100) NOT NULL,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log (for recent activity on dashboard)
CREATE TABLE activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  action VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 11. .env file

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root1234
DB_NAME=careerdock_db
JWT_SECRET=careerdock_super_secret_jwt_key_2025_v2
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=<user_will_add_later>
OPENAI_API_KEY=<user_will_add_later>
GITHUB_TOKEN=<optional>
```

---

## 12. NPM PACKAGES NEEDED

### Backend:
```
express mysql2 jsonwebtoken bcryptjs cors dotenv multer
pdf-parse uuid nodemon
```
Optional for AI: `@google/generative-ai` (Gemini) or `openai`

### Frontend:
```
axios react-router-dom react-icons lucide-react
react-markdown react-quill date-fns recharts
framer-motion react-hot-toast
```

---

## 13. BUILD ORDER

1. **Theme system** — CSS variables, ThemeContext, dark mode toggle. Get this working first so every page uses it.
2. **Auth** — Login/Register with JWT. Glassmorphism login card.
3. **App Shell** — Sidebar + main layout + routing.
4. **Applications** — CRUD + file upload + search/filter.
5. **Tracker** — Company cards with tabs (rounds, notes, JD, company info, status).
6. **Dashboard** — Stats + streak + upcoming rounds + activity.
7. **Resumes** — Upload + ATS score + AI suggestions.
8. **AI Chat** — Chat interface + Gemini/OpenAI integration.
9. **Planner** — Calendar + Tasks + LeetCode + GitHub integrations.
10. **Account** — Theme picker, dark mode, profile, switch account.
11. **Polish** — Animations, loading states, empty states, responsiveness, notifications.

---

## 14. LOGO (keep same)
- CD monogram in a circle + "**Career**Dock" wordmark.
- "Career" in light/cream on dark sidebar, "Dock" in accent color.
- Tagline: "Track every application. Miss nothing."

---

## 15. QUICK START PROMPT FOR CLAUDE CODE

> "Read CAREERDOCK_V2_SPEC.md. Delete all existing frontend and backend code. Rebuild CareerDock from scratch with Node.js/Express backend and React+Vite frontend. Start with: 1) New MySQL schema (drop old tables, create new ones from the spec). 2) Express app setup with JWT auth. 3) Theme system with 7 themes + dark mode. 4) Glassmorphism login/register page. Then we build section by section."
