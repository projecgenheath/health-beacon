# 📋 Deployment Checklist

Use this checklist to ensure everything is properly configured and deployed.

## ✅ Pre-Deployment Checklist

### 1. Local Configuration
- [x] `.env` file updated with your Supabase credentials
- [x] `.env` file updated with Gemini API key
- [x] `supabase/config.toml` updated with correct project ID
- [x] Lovable dependencies removed from `package.json`
- [x] Lovable plugin removed from `vite.config.ts`
- [x] HTML metadata updated (no Lovable branding)
- [x] `.gitignore` updated to protect `.env` file
- [ ] Local development server tested (`npm run dev`)

### 2. Supabase Setup
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged into Supabase (`supabase login`)
- [ ] Project linked (`supabase link --project-ref nqptevzigcimmer5ryppbg`)
- [ ] Environment variables set in Supabase:
  - [ ] `GEMINI_API_KEY` set
  - [ ] `RESEND_API_KEY` set (if using email)
- [ ] Database tables verified:
  - [ ] `profiles` table exists
  - [ ] `exams` table exists
  - [ ] `health_metrics` table exists
  - [ ] Row Level Security (RLS) enabled on all tables

### 3. Edge Functions Deployment
- [ ] `process-exam` function deployed
- [ ] `send-exam-alerts` function deployed (if exists)
- [ ] `send-digest` function deployed (if exists)
- [ ] Edge function logs checked for errors
- [ ] Test invocation successful

### 4. Authentication Configuration
- [ ] Email confirmation settings configured in Supabase Auth
- [ ] Redirect URLs configured (if needed)
- [ ] OAuth providers configured (if using)
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test password reset flow

### 5. Testing
- [ ] User registration works
- [ ] User login works
- [ ] Profile page loads correctly
- [ ] Exam upload works
- [ ] Exam processing with Gemini AI works
- [ ] Health metrics display correctly
- [ ] No console errors in browser
- [ ] No errors in Supabase Edge Function logs

### 6. Security Review
- [ ] `.env` file is in `.gitignore`
- [ ] No API keys committed to Git
- [ ] RLS policies enabled on all tables
- [ ] Supabase Secret Key not exposed in frontend
- [ ] CORS configured correctly in Edge Functions
- [ ] Consider rotating Gemini API key (it was exposed in this conversation)

### 7. Production Build
- [ ] Production build successful (`npm run build`)
- [ ] No build errors or warnings
- [ ] Preview production build (`npm run preview`)
- [ ] Test production build locally

### 8. Deployment (Choose your platform)

#### Option A: Vercel
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
  - [ ] `VITE_GEMINI_API_KEY`
- [ ] Deploy and test

#### Option B: Netlify
- [ ] Connect GitHub repository to Netlify
- [ ] Configure environment variables in Netlify
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Deploy and test

#### Option C: Custom Server
- [ ] Build production bundle
- [ ] Upload `dist` folder to server
- [ ] Configure web server (nginx/apache)
- [ ] Set up SSL certificate
- [ ] Test deployment

### 9. Post-Deployment
- [ ] Test all features in production
- [ ] Monitor Supabase Edge Function logs
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Set up analytics (if needed)
- [ ] Document any production-specific configurations

## 🚨 Critical Items

These items MUST be completed before going to production:

1. **Rotate API Keys**: The Gemini API key has been exposed in this conversation. Generate a new one from Google Cloud Console.
2. **Enable RLS**: Ensure Row Level Security is enabled on ALL Supabase tables.
3. **Test Authentication**: Thoroughly test all auth flows before launch.
4. **Backup Strategy**: Set up automated backups for your Supabase database.

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Gemini API Docs**: https://ai.google.dev/docs
- **Vite Docs**: https://vitejs.dev/
- **React Docs**: https://react.dev/

## 🔄 Rollback Plan

If something goes wrong:

1. **Frontend**: Revert to previous Git commit
2. **Edge Functions**: Use Supabase dashboard to rollback function versions
3. **Database**: Restore from Supabase backup (if available)
4. **Environment Variables**: Keep a secure backup of all env vars

---

**Last Updated:** 2026-01-12  
**Status:** Ready for deployment testing
