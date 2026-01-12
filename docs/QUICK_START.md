# 🚀 Quick Start Guide - Health Beacon

## Your Configuration

### Supabase
- **Project ID:** `nqptevzigcimmer5ryppbg`
- **URL:** `https://nqptevzigcimmer5ryppbg.supabase.co`
- **Publishable Key:** `sb_publishable_nQpteVZigcImMer5ryPpbg_aGFbe87v`
- **Secret Key:** `sb_secret_sPnRhsD3FjFzp7cbV6OqFA_cvUEj7XY` (Keep this secure!)

### Gemini AI
- **API Key:** `AIzaSyAvogvmHAcdf05NMwtU6NcSqmd1pwB6Ego`

## 🏃 Running the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Application runs on: **http://localhost:8080**

## 📦 Deploying Edge Functions

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref nqptevzigcimmer5ryppbg

# 4. Set the Gemini API key in Supabase
supabase secrets set GEMINI_API_KEY=AIzaSyAvogvmHAcdf05NMwtU6NcSqmd1pwB6Ego

# 5. Deploy the Edge Function
supabase functions deploy process-exam
```

## 🔍 Checking Status

### View Supabase Dashboard
Visit: https://supabase.com/dashboard/project/nqptevzigcimmer5ryppbg

### Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click on `process-exam`
4. View logs and invocations

### Check Database Tables
1. Go to Supabase Dashboard
2. Navigate to **Database** → **Tables**
3. Verify tables exist: `profiles`, `exams`, `health_metrics`

## ⚠️ Important Security Notes

1. **Never commit `.env` file** - It's now in `.gitignore`
2. **Rotate API keys** if they've been exposed
3. **Use Secret Key only on server-side** - Never expose in frontend code
4. **Enable Row Level Security (RLS)** on all Supabase tables

## 🐛 Common Issues

### Issue: "Supabase connection failed"
**Solution:** 
- Check `.env` file has correct values
- Restart dev server: `npm run dev`

### Issue: "Exam processing error"
**Solution:**
- Verify `GEMINI_API_KEY` is set in Supabase: `supabase secrets list`
- Check Edge Function logs in Supabase dashboard
- Ensure function is deployed: `supabase functions list`

### Issue: "Authentication not working"
**Solution:**
- Verify Supabase URL and Publishable Key in `.env`
- Check if email confirmation is required in Supabase Auth settings
- Clear browser cache and try again

## 📚 Documentation

- **Full Migration Details:** `docs/MIGRATION_SUMMARY.md`
- **Supabase Setup Guide:** `docs/SUPABASE_SETUP.md`
- **Main README:** `README.md`

## 🎯 Next Steps

1. ✅ Configuration files updated
2. ⏳ Deploy Edge Functions to Supabase
3. ⏳ Test authentication flow
4. ⏳ Test exam upload and processing
5. ⏳ Verify all features work correctly

## 💡 Tips

- Use **Supabase Studio** (local) for development: `supabase start`
- Monitor **Edge Function logs** for debugging
- Check **Network tab** in browser DevTools for API errors
- Use **React Query DevTools** for state debugging

---

**Need Help?** Check the detailed guides in the `docs/` folder!
