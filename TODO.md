# Deployment Plan for Vortex AI-Powered LMS

## Steps to Complete Deployment

### 1. Frontend (Vercel)
- [x] Add `vercel.json` configuration file for Next.js deployment
- [x] Update build script to remove turbopack for production
- [ ] Update environment variables in Vercel dashboard:
  - NEXT_PUBLIC_API_BASE_URL (to Railway backend URL)
  - NEXT_PUBLIC_FRONTEND_URL (Vercel domain)
  - NEXT_PUBLIC_BACKEND_URL (Railway backend URL)
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY

### 2. Backend (Railway)
- [x] Add `railway.json` configuration for Node.js deployment
- [x] Update package.json scripts for production (change start script from nodemon to node)
- [ ] Set environment variables in Railway:
  - FRONTEND_URL (Vercel domain)
  - BACKEND_URL (Railway backend URL)
  - PYTHON_SERVER_URL (Railway Python server URL)
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - JWT_SECRET
  - PORT=5000

### 3. Python Server (Railway)
- [x] Add `railway.json` configuration for Python/FastAPI deployment
- [x] Clean up requirements.txt (remove PowerShell commands, keep pip installs)
- [x] Update app.py to use PORT environment variable and disable reload in production
- [ ] Set environment variables in Railway:
  - FRONTEND_URL (Vercel domain)
  - BACKEND_URL (Railway backend URL)
  - PYTHON_SERVER_URL (Railway Python server URL)
  - PORT=8000

### 4. GitHub and Deployment
- [ ] Push all configuration changes to GitHub repository
- [ ] Connect GitHub repo to Vercel for frontend deployment
- [ ] Connect GitHub repo to Railway for backend deployment
- [ ] Connect GitHub repo to Railway for Python server deployment
- [ ] Configure build settings and environment variables on each platform
- [ ] Trigger deployments and monitor for errors

### 5. Testing and Verification
- [ ] Test frontend deployment on Vercel
- [ ] Test backend API endpoints on Railway
- [ ] Test Python server endpoints on Railway
- [ ] Verify Supabase integration works in production
- [ ] Test end-to-end functionality (auth, courses, etc.)
