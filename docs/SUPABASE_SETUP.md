# Supabase Configuration Guide

This document explains how to configure your Supabase project to work with Health Beacon.

## Environment Variables

Your Supabase project needs the following environment variables configured:

### 1. Gemini API Key (Required)

This is used by the `process-exam` Edge Function to analyze medical exams.

**Variable Name:** `GEMINI_API_KEY`  
**Value:** `AIzaSyAvogvmHAcdf05NMwtU6NcSqmd1pwB6Ego`

### 2. Resend API Key (Optional - for email notifications)

If you want to send email notifications for exam alerts and digests.

**Variable Name:** `RESEND_API_KEY`  
**Value:** Your Resend API key (if you have one)

## How to Set Environment Variables in Supabase

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Scroll to **Secrets** section
4. Click **Add Secret**
5. Enter the variable name and value
6. Click **Save**

### Option 2: Using Supabase CLI

```bash
# Set the Gemini API key
supabase secrets set GEMINI_API_KEY=AIzaSyAvogvmHAcdf05NMwtU6NcSqmd1pwB6Ego

# Set the Resend API key (if needed)
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

## Deploying Edge Functions

After setting the environment variables, deploy your Edge Functions:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref nqptevzigcimmer5ryppbg

# Deploy the process-exam function
supabase functions deploy process-exam

# Deploy other functions (if they exist)
supabase functions deploy send-exam-alerts
supabase functions deploy send-digest
```

## Verifying the Configuration

To verify that your Edge Function is working correctly:

1. Go to **Edge Functions** in your Supabase dashboard
2. Find the `process-exam` function
3. Click on it to see logs and test it
4. You can also test it from your application by uploading an exam

## Database Setup

Make sure your Supabase database has the required tables:

- `profiles`: User profile information
- `exams`: Medical exam records
- `health_metrics`: Health tracking data

You can check the existing schema by going to **Database** → **Tables** in your Supabase dashboard.

## Security Notes

⚠️ **IMPORTANT**: The API keys shown in this document are sensitive credentials. Make sure to:

1. Never commit this file to a public repository
2. Rotate your API keys regularly
3. Use Row Level Security (RLS) policies in Supabase to protect your data
4. Keep your `.env` file in `.gitignore`

## Troubleshooting

### Edge Function Errors

If you see errors in the Edge Function logs:

1. Check that `GEMINI_API_KEY` is set correctly
2. Verify the Gemini API key is valid and has not expired
3. Check the function logs in Supabase dashboard
4. Ensure the image data is properly base64 encoded

### Connection Issues

If the frontend can't connect to Supabase:

1. Verify the `VITE_SUPABASE_URL` in `.env` is correct
2. Check that `VITE_SUPABASE_PUBLISHABLE_KEY` is the correct publishable key
3. Ensure CORS is properly configured in your Edge Functions

## Next Steps

1. Set the environment variables in Supabase
2. Deploy the Edge Functions
3. Test the exam processing feature
4. Monitor the logs for any issues
