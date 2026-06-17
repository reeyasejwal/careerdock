require('dotenv').config();

// Validate required env vars at startup — errors appear in Render logs
const REQUIRED = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'JWT_EXPIRES_IN'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error('[STARTUP ERROR] Missing required env vars:', missing.join(', '));
  console.error('[STARTUP ERROR] Set these in Render → Environment before all API calls will work.');
}
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('[STARTUP WARN] Cloudinary env vars missing — file uploads will fail.');
}

const app = require('./src/app');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CareerDock backend running on port ${PORT}`));
