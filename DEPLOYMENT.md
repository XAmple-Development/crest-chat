# Deployment Guide - LovableChat to Netlify

This guide will walk you through deploying your LovableChat application to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account (free at [netlify.com](https://netlify.com))
- A Supabase project (free at [supabase.com](https://supabase.com))

## Step 1: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Choose your organization
   - Enter project details and create

2. **Run Database Migrations**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `supabase/migrations/20250825163052_3e70c235-3a07-43a1-9c08-90b3af80da2b.sql`
   - Run the migration

3. **Get Your Credentials**
   - Go to Settings > API
   - Copy your Project URL and anon public key

## Step 2: Prepare Your Code

1. **Update Supabase Configuration**
   - Open `src/integrations/supabase/client.ts`
   - Replace the placeholder values with your actual Supabase credentials:
   ```typescript
   const SUPABASE_URL = "your-project-url";
   const SUPABASE_PUBLISHABLE_KEY = "your-anon-key";
   ```

2. **Commit and Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## Step 3: Deploy to Netlify

### Option A: Deploy via Netlify UI (Recommended)

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and authorize Netlify
   - Select your repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

3. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add the following variables:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. **Redeploy**
   - Go to Deploys tab
   - Click "Trigger deploy" > "Deploy site"

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   # Build your project
   npm run build
   
   # Deploy to Netlify
   netlify deploy --prod --dir=dist
   ```

4. **Set Environment Variables**
   ```bash
   netlify env:set VITE_SUPABASE_URL "your-supabase-url"
   netlify env:set VITE_SUPABASE_ANON_KEY "your-supabase-anon-key"
   ```

## Step 4: Configure Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Site settings > Domain management
   - Click "Add custom domain"
   - Enter your domain name
   - Follow the DNS configuration instructions

2. **SSL Certificate**
   - Netlify automatically provisions SSL certificates
   - Your site will be available at `https://yourdomain.com`

## Step 5: Test Your Deployment

1. **Test Authentication**
   - Visit your deployed site
   - Try creating an account
   - Test signing in and out

2. **Test Real-time Features**
   - Create a server
   - Send messages
   - Verify real-time updates work

3. **Test Mobile Responsiveness**
   - Open your site on mobile devices
   - Test the responsive design

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version (use 18+)
   - Check build logs in Netlify dashboard

2. **Environment Variables Not Working**
   - Ensure variables start with `VITE_`
   - Redeploy after setting environment variables
   - Check variable names match exactly

3. **Database Connection Issues**
   - Verify Supabase URL and key are correct
   - Check Supabase project is active
   - Ensure RLS policies are configured

4. **Real-time Not Working**
   - Check Supabase real-time is enabled
   - Verify database triggers are set up
   - Check browser console for errors

### Getting Help

- Check Netlify build logs for detailed error messages
- Review Supabase logs in the dashboard
- Open an issue in the GitHub repository

## Post-Deployment

1. **Monitor Performance**
   - Use Netlify Analytics (if enabled)
   - Monitor Supabase usage
   - Check for any errors in logs

2. **Set Up Monitoring**
   - Enable Netlify notifications
   - Set up Supabase alerts
   - Monitor application performance

3. **Backup Strategy**
   - Regular database backups in Supabase
   - Version control for code changes
   - Document configuration changes

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive keys to Git
   - Use Netlify's environment variable system
   - Rotate keys regularly

2. **Database Security**
   - Review RLS policies
   - Monitor database access
   - Enable Supabase security features

3. **Application Security**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Implement proper error handling

---

Your LovableChat application should now be live and ready to use! 🎉
