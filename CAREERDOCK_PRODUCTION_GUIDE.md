# CareerDock — Production Ready Fixes + Deployment Guide

## PART 1: FINAL BUG FIXES (do these before deploying)

### Fix 1 — Security (CRITICAL before going live)
```
1. In backend, add rate limiting to prevent abuse:
   npm install express-rate-limit

   In app.js:
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per 15 min
   });
   app.use('/api/', limiter);

   Stricter limit for auth routes:
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 10 // only 10 login attempts per 15 min
   });
   app.use('/api/auth/', authLimiter);

2. Add helmet for security headers:
   npm install helmet
   const helmet = require('helmet');
   app.use(helmet());

3. Validate all inputs on backend — never trust frontend data:
   - Email format validation on register
   - Password minimum 8 characters
   - Sanitize all text inputs to prevent XSS
   npm install express-validator

4. Make sure .env is in .gitignore (NEVER push to GitHub)
   Check .gitignore has: .env, node_modules, uploads/
```

### Fix 2 — Error Handling
```
1. Add global error handler in app.js (last middleware):
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(500).json({ 
       error: 'Something went wrong. Please try again.' 
     });
   });

2. Add 404 handler:
   app.use((req, res) => {
     res.status(404).json({ error: 'Route not found' });
   });

3. Wrap all async controller functions in try-catch:
   Every controller function must have:
   try {
     // logic
   } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'Server error' });
   }

4. On frontend, handle API errors gracefully:
   - Show user-friendly error messages (not raw error objects)
   - If token expires, automatically redirect to login
   - Add axios interceptor for 401 responses:
     api.interceptors.response.use(
       response => response,
       error => {
         if (error.response?.status === 401) {
           localStorage.clear();
           window.location.href = '/login';
         }
         return Promise.reject(error);
       }
     );
```

### Fix 3 — Performance
```
1. Add loading states to EVERY data fetch — no blank screens
2. Add pagination to Applications list (10 per page)
3. Compress images and assets
4. In vite.config.js add build optimization:
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           vendor: ['react', 'react-dom', 'react-router-dom'],
           charts: ['recharts'],
         }
       }
     }
   }
```

### Fix 4 — SEO & Meta Tags
```
In index.html, update the <head> section:
<title>CareerDock — Track Every Application. Miss Nothing.</title>
<meta name="description" content="CareerDock is the ultimate placement organizer for students. Track applications, manage interview rounds, analyze resumes, and prepare smarter with AI. Free to use.">
<meta name="keywords" content="placement tracker, job application tracker, campus placement, interview tracker, ATS score, resume analyzer, placement organizer for students">
<meta name="author" content="CareerDock">
<meta property="og:title" content="CareerDock — Your Placement Command Center">
<meta property="og:description" content="Track every application. Manage every round. Miss nothing.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://careerdock.app">
<link rel="canonical" href="https://careerdock.app">

Also add a favicon — use the CD logo as favicon.ico
```

### Fix 5 — PWA (makes it installable on phone like an app)
```
In vite.config.js:
npm install vite-plugin-pwa

import { VitePWA } from 'vite-plugin-pwa'
plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'CareerDock',
      short_name: 'CareerDock',
      description: 'Track every application. Miss nothing.',
      theme_color: '#3D5435',
      background_color: '#FAF8F2',
      display: 'standalone',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    }
  })
]
```

---

## PART 2: DEPLOYMENT (step by step)

### Step 1 — Push code to GitHub
```bash
# In careerdock folder
git init
git add .
git commit -m "CareerDock v1.0 — initial release"

# Create a NEW repo on github.com called "careerdock"
# Then:
git remote add origin https://github.com/YOUR_USERNAME/careerdock.git
git branch -M main
git push -u origin main

⚠️ IMPORTANT: Make sure .gitignore has:
.env
node_modules/
uploads/
*.log
dist/
```

### Step 2 — Deploy Database (Railway)
```
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Provision MySQL"
4. Railway gives you a MySQL database in the cloud
5. Click on the database → "Connect" tab
6. Copy these values (you'll need them):
   - MYSQL_HOST
   - MYSQL_USER  
   - MYSQL_PASSWORD
   - MYSQL_DATABASE
   - MYSQL_PORT

7. Open MySQL Workbench → connect to the Railway MySQL 
   using those credentials
8. Run your entire schema SQL script on the Railway database
   (same SQL you ran locally)
```

### Step 3 — Deploy Backend (Railway)
```
1. In Railway dashboard → "New Project" → "Deploy from GitHub repo"
2. Select your careerdock repo
3. Select the careerdock-backend folder as root
4. Railway auto-detects Node.js

5. Add Environment Variables in Railway dashboard:
   Click on your backend service → "Variables" tab
   Add ALL these:
   
   PORT=5000
   DB_HOST=[Railway MySQL host]
   DB_USER=[Railway MySQL user]
   DB_PASSWORD=[Railway MySQL password]
   DB_NAME=[Railway MySQL database name]
   DB_PORT=[Railway MySQL port]
   JWT_SECRET=careerdock_super_secret_jwt_key_2025_v2
   JWT_EXPIRES_IN=7d
   GROQ_API_KEY=[your Groq key]
   GEMINI_API_KEY=[your Gemini key if you got it]
   NODE_ENV=production

6. Railway will build and deploy automatically
7. You'll get a URL like: https://careerdock-backend.railway.app
   SAVE THIS URL — you need it for frontend
```

### Step 4 — Deploy Frontend (Vercel)
```
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project" → Import your careerdock repo
4. Set Root Directory to: careerdock-frontend
5. Framework: Vite
6. Add Environment Variable:
   VITE_API_URL=https://careerdock-backend.railway.app/api
   
7. In your frontend, update api.js:
   const API = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
   });

8. Click Deploy!
9. Vercel gives you a URL like: https://careerdock.vercel.app
```

### Step 5 — Get a custom domain (optional but impressive)
```
Option 1 — Free subdomain: careerdock.vercel.app (already given)

Option 2 — Buy a domain (~₹800/year):
- Go to Namecheap or GoDaddy
- Search "careerdock.app" or "careerdock.in"
- Buy it (~₹800-1500/year)
- In Vercel: Settings → Domains → Add your domain
- Follow DNS instructions
- Done! Now it's https://careerdock.app 🎉

Option 3 — Free .tech domain for students:
- Go to https://github.com/education/students
- Apply for GitHub Student Pack (free with college email)
- Get free .tech domain for 1 year
```

### Step 6 — File uploads in production
```
Currently files are stored locally in uploads/ folder.
For production, use Cloudinary (free):

1. Sign up at cloudinary.com (free tier)
2. npm install cloudinary multer-storage-cloudinary
3. Update multer config to use Cloudinary storage
4. Add to .env: 
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx

This way resume files are stored in the cloud, not locally.
```

---

## PART 3: MAKING IT SHOW ON GOOGLE 🔍

### Google Search Console
```
1. Go to https://search.google.com/search-console
2. Add your website URL
3. Verify ownership (Vercel makes this easy)
4. Submit your sitemap

Add sitemap.xml to public folder:
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://careerdock.app/</loc></url>
  <url><loc>https://careerdock.app/login</loc></url>
  <url><loc>https://careerdock.app/register</loc></url>
</urlset>
```

### Landing Page (IMPORTANT for Google)
```
Create a public landing page at "/" (before login) with:
- Hero section: "Track every application. Miss nothing."
- Features overview (Applications, Tracker, AI Chat etc)
- Screenshots of the app
- "Get Started Free" button → /register
- SEO-optimized content so Google can index it

Currently your app redirects straight to /login which Google 
can't index properly. A landing page fixes this AND makes it 
look like a real product.
```

---

## PART 4: PRE-LAUNCH CHECKLIST ✅

Before telling people about it, verify:

- [ ] Register with a new test account works
- [ ] Login works
- [ ] Add an application works
- [ ] Tracker shows the application
- [ ] Add a round works  
- [ ] DockAI chat responds
- [ ] Resume upload works
- [ ] ATS score generates
- [ ] Planner tasks work
- [ ] GitHub repos load
- [ ] All themes switch correctly
- [ ] Dark mode works
- [ ] Sign out works and redirects to login
- [ ] Can't access dashboard without login
- [ ] Mobile layout looks acceptable
- [ ] No console errors on any page
- [ ] All loading states show properly
- [ ] Empty states show when no data

---

## PART 5: HONEST SUGGESTIONS TO MAKE IT BETTER 💡

1. **Landing page** — most important! Without it Google 
   can't find you and users don't know what the app does

2. **Onboarding flow** — when user registers for first time, 
   show a quick 3-step guide: "Add your first application → 
   Track it in Tracker → Use DockAI to prep"

3. **Email notifications** — for round reminders 
   (use Nodemailer + Gmail SMTP, both free)

4. **Export feature** — let users export their applications 
   as Excel/CSV — very useful for students

5. **Share interview experience** — let users optionally 
   make their tracker notes public so other students 
   can read interview experiences (like GFG experiences)

6. **Company database** — pre-populate 50 common campus 
   companies (TCS, Infosys, Google, Microsoft etc) so 
   users don't have to type everything manually

7. **Mobile app** — since you added PWA support, students 
   can "install" it on their phones from browser — 
   promote this feature!
