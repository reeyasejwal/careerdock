# CareerDock — Fix & Improvement Prompt for Claude Code

Fix and improve the following sections of CareerDock. Each section is clearly described. Implement ALL of them.

---

## 1. APPLICATIONS — Filter Fix + Calendar Sync

### Filter UI Fix:
- The current filter UI is broken/ugly. Replace it with a clean, classy filter bar.
- Filter options should be: **Package** (range slider or min/max inputs), **Location** (dropdown or text search), **Tech Stack** (multi-select tag chips), **Role** (text search), **Status** (Applied / In Process / Offered / Rejected as toggle chips).
- Filter bar should sit below the search bar, styled as a horizontal row of filter chips/dropdowns.
- Active filters should be highlighted (accent color) and show a clear "✕" to remove them.
- Filters should combine (AND logic) — show only applications matching ALL active filters.
- CSS must be clean — no overflow, proper spacing, responsive.

### Calendar Sync on Application Add:
- When a user adds a new application with a date, **immediately create a `calendar_events` entry** in the database with:
  - `title`: "Applied to [Company Name]"
  - `event_date`: the applied_date from the application
  - `source`: 'tracker'
  - `color`: theme accent color
- This must happen automatically in the backend when POST /api/applications is called — no extra user action needed.

---

## 2. DASHBOARD — Streak Fix + Quote Fix

### Streak Fix (CRITICAL):
- **Delete all existing streak data and start fresh for all users** (reset streak_count to 0 and last_active_date to NULL in the users table).
- Streak logic rules (strictly follow these):
  1. Streak only increments when the user **completes at least one task in the Planner** on that day.
  2. One increment per day maximum — if they complete 10 tasks, streak still only goes up by 1 for that day.
  3. If the user skips a day (no task completed), streak resets to 0.
  4. Simply logging in does NOT count — must complete a task.
  5. On the backend, when a task is marked as done (`PATCH /api/tasks/:id/toggle` to done), call a `updateStreak(userId)` function:
     - Get today's date (date only, no time).
     - Get `last_active_date` from users table.
     - If `last_active_date` = today → do nothing (already counted today).
     - If `last_active_date` = yesterday → increment streak by 1, set `last_active_date` = today.
     - If `last_active_date` is null or older than yesterday → reset streak to 1, set `last_active_date` = today.
  6. Store and display streak on dashboard. Show motivational messages:
     - 1: "Great start! Day 1 begins! 🌱"
     - 3: "3 days strong! Building momentum! 💪"
     - 7: "One week streak! You're on fire! 🔥"
     - 14: "Two weeks! Unstoppable! 🚀"
     - 30: "30 days! Legend status! 🏆"
     - 50: "🥇 50 DAY BADGE UNLOCKED! You're incredible!"
     - 100: "💎 100 DAY BADGE UNLOCKED! Absolute champion!"
  7. Award badges at 50 and 100 days — store in `badges` table — display permanently on dashboard.

### Quote Fix:
- Show ONE quote per day — the same quote all day, new quote at midnight (12:00 AM).
- Implementation: store the quote + the date it was shown in localStorage (`{ quote: "...", date: "2024-06-11" }`).
- On load, check if stored date = today. If yes, show stored quote. If no, pick a new random quote from a hardcoded array of 30+ meaningful placement/career quotes and store it with today's date.
- This way the quote changes every day at midnight automatically without any API call.
- Never show the same quote two days in a row.

---

## 3. TRACKER — Multiple Fixes

### Fix 1 — Calendar NOT Updating:
- When a round is added with a `scheduled_at` date, **automatically create a `calendar_events` entry**:
  - `title`: "[Company Name] — Round [N] ([Category])"
  - `event_date`: date part of `scheduled_at`
  - `event_time`: time part of `scheduled_at`
  - `source`: 'tracker'
  - `source_id`: the round's id
- When a round is deleted, **also delete** the corresponding calendar_event (match by source='tracker' and source_id=round_id).
- When a round is updated (date changed), **update** the calendar_event too.
- The Planner calendar must show these events — fix the calendar fetch to include both manual events AND tracker-sourced events from `calendar_events` table.

### Fix 2 — Round Delete & Edit:
- Each round in the rounds list must have an **Edit (pencil icon)** and **Delete (trash icon)** button.
- Edit opens an inline form or modal to change: category, scheduled_at, status, notes.
- Delete removes the round (and its calendar event).
- Confirm before delete: "Delete this round?" Yes/No.

### Fix 3 — JD Section:
- Do NOT just show the JD file link. Extract and display the JD content properly:
  - If `jd_text` exists: display it in a readable formatted text area (scrollable, not editable).
  - If `jd_file_url` exists (PDF): show a "View JD File" button that opens it in a new tab, AND extract the text server-side (use `pdf-parse`) and show the extracted text below.
  - Show tech stack as colorful tag chips pulled from the application data.
  - JD file link goes at the BOTTOM, text content at the TOP.

### Fix 4 — Company Info Section:
- This section is showing nothing. Fix it:
  - On first load of a company card, call `GET /api/company-info/:appId`.
  - Backend checks `company_info` table for cached data. If found and fetched within 7 days, return cached.
  - If not found or stale, call Gemini API (or OpenAI) with prompt: "Give me a brief company profile for [company_name] suitable for placement interview prep. Include: 1) Industry/Domain, 2) Key Products & Services, 3) Company Culture, 4) Tech Stack typically used, 5) Common HR interview questions for this company. Keep it concise and practical."
  - If NO API key is configured, show a helpful placeholder: "Connect your Gemini API key in Account Settings to enable AI company insights." with a button to go to settings.
  - Cache the response in `company_info` table.
  - Display the info in clean sections with icons.

### Fix 5 — Collapse Bug (CRITICAL):
- Currently clicking "Collapse" on one company collapses ALL companies. This is wrong.
- Fix: each company card must have its own independent expanded/collapsed state in React.
- Use a state like `const [expandedCards, setExpandedCards] = useState({})` where keys are application IDs.
- Toggling one card only affects that card's state — completely independent of others.
- Do NOT use a single global `isExpanded` boolean for all cards.

### Fix 6 — Add Round Button:
- Make the "+ Add Round" button prominent and easy to find inside each company card.
- Position it clearly at the bottom of the rounds list or as a floating button within the rounds tab.
- The add round form should have: Category (dropdown: Screening, OA, Technical, HR, Managerial, Group Discussion, Other — if Other, show a text input for custom name), Scheduled Date, Scheduled Time, Status (Upcoming default), Notes (optional textarea).

### Fix 7 — View Details Card:
- The expanded company card ("View Details") should be clean, organized, and premium looking.
- Use tabs: Rounds | Notes | JD & Tech Stack | Company Info | Status
- Each tab has its own scrollable content area.
- Card should be large enough to comfortably display content — not cramped.
- Add smooth tab transition animations.

---

## 4. RESUME — Personalized AI Suggestions

- AI suggestions must be UNIQUE per resume — not generic.
- When calling the AI for suggestions, send the ACTUAL extracted text of that specific resume.
- Prompt to use: "You are an expert resume reviewer for software engineering placements. Review this resume carefully and provide: 1) Specific spelling/grammar mistakes found (quote the exact text), 2) Weak sections that need improvement with specific examples from the resume, 3) Missing sections important for SDE roles, 4) Specific rewording suggestions for bullet points (show original → improved), 5) ATS optimization tips based on this resume's content. Be specific and reference actual content from the resume."
- Show suggestions in a structured format: each suggestion as a card with type (Spelling Error / Weak Section / Missing Section / Reword / ATS Tip) and specific content.
- If two resumes are uploaded, they should get completely different suggestions based on their actual content.
- Show a loading state while AI processes — "Analyzing your resume..."

---

## 5. AI CHATBOX — Fix (No Key Required for Basic Use)

- The chat should NEVER block the user asking for an API key upfront.
- Implementation options (try in this order):
  1. **Use Gemini API free tier** — store the key in the backend `.env` file as `GEMINI_API_KEY`. The user does NOT need to enter it — it's server-side. If the key is missing from .env, show a friendly message in chat: "AI Chat is being set up. Please ask your administrator to configure the API key." NOT a hard error.
  2. **Fallback**: if no API key configured, use a smart rule-based response system for common placement questions (DSA tips, HR questions, resume advice) so the chat is still useful.
- The chat interface must always load and be usable — never show a blank screen or hard error.
- Fix the chat UI: messages should display properly, user messages right-aligned (accent color bubble), AI messages left-aligned (glass card), timestamps shown.
- Add a typing indicator (animated dots) while waiting for AI response.
- "New Chat" button works and clears the conversation.
- Chat history persists in database and shows in left sidebar list.

---

## 6. PLANNER — Complete Redesign

Remove the category-based task system. Redesign Planner with these exact sections:

### Section A — Tasks (Simple Input):
- User adds tasks with: Task name, Time (when to do it — time picker), optional description.
- NO categories (remove DSA, OA, etc. category filter completely).
- Three columns/tabs:
  1. **Today's Tasks** — tasks for today
  2. **Completed** — tasks marked done (with satisfying checkmark animation)
  3. **Pending / Not Done** — tasks that were added but not completed
- Each task has: checkbox to mark done, edit, delete.
- A **"Reset All"** button to clear all tasks and start fresh.
- When a task is marked complete → check if ALL of today's tasks are done → if yes, trigger streak update (call the streak endpoint).

### Section B — Auto Schedule:
- Website automatically generates a schedule based on tasks the user has added.
- Schedule displayed as a **clean table**:
  | Time | Task | Status |
  |------|------|--------|
  | 9:00 AM | Review resume | Pending |
  | 11:00 AM | LeetCode practice | Pending |
- If user added tasks with specific times, use those times.
- If no time specified, auto-distribute tasks across the day (9 AM onwards, 1-2 hour slots).
- At the bottom of the schedule: **"Today's Targets"** section — list of all tasks as checklist.
- Make this section look like a premium daily planner — clean table, sage accent headers, alternating row colors.

### Section C — Calendar (FIX):
- Calendar must show events from BOTH:
  1. Rounds added in Tracker (from `calendar_events` table where source='tracker')
  2. Manual events added by user
- Fetch from `GET /api/planner/calendar/:year/:month` — fix this endpoint to return ALL events for that month from `calendar_events` table for the logged-in user.
- Each event on the calendar should be a colored dot or small chip on the date.
- Clicking a date shows a popup/panel with all events for that day.
- Today's date highlighted with accent color.
- Navigation: previous/next month arrows.

### Section D — GitHub (Keep + Add Sticky Notes):
- Keep existing GitHub repo fetching (it works).
- Add a **sticky note** icon on each repo card.
- Clicking the sticky note opens a small modal/popover where user can write notes about that repo.
- Notes saved to backend: `POST /api/integrations/github/notes` with `{ username, repoName, note }`.
- Notes persist and show as a preview on the repo card.
- Style sticky notes as small yellow/cream post-it looking cards.

### Remove:
- Remove the LeetCode "category" filter (DSA, OA, etc.) from Planner completely.
- Remove all category-related UI from tasks.

---

## 7. GENERAL CSS & QUALITY FIXES

- All sections must be responsive — no text overflowing outside boxes anywhere.
- Stat cards on dashboard: use `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))` so they wrap properly on smaller screens.
- All card text: `word-break: break-word; overflow-wrap: break-word;` to prevent overflow.
- Consistent padding inside all cards: minimum `16px` on all sides.
- Loading states: show skeleton loaders (shimmer effect) for all data-fetching sections.
- Empty states: show a friendly message + icon when sections have no data.
- Toast notifications: use react-hot-toast for all success/error messages.
- Smooth animations everywhere: fade-in on page load, slide-up on card enter.

---

## PRIORITY ORDER (fix in this order):
1. Streak reset + correct logic ← most broken, fix first
2. Tracker collapse bug ← critical UX bug
3. Calendar not updating ← important feature
4. Planner redesign
5. Filter UI fix
6. JD section + Company info
7. AI Chat fix
8. Resume suggestions personalization
9. General CSS fixes
