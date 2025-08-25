# Deployment Guide - CrestChat

## 🚀 Deploying to Netlify

### Prerequisites
- A GitHub repository with your CrestChat code
- A Supabase project set up with the database schema

### Step 1: Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to SQL Editor
3. Copy and paste the contents of `complete-database-setup.sql`
4. Run the script to create all tables, functions, and policies
5. Note your project URL and anon key from Settings > API

### Step 2: Deploy to Netlify

#### Option A: Deploy via Netlify UI
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site"

#### Option B: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

### Step 3: Configure Environment Variables
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add the following variables:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

### Step 4: Configure Domain (Optional)
1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS settings as instructed

## 🔧 Troubleshooting

### Build Errors
- **TypeScript errors**: Make sure all dependencies are installed
- **Environment variables**: Ensure all required env vars are set in Netlify
- **Import errors**: Check that all file paths are correct

### Runtime Errors
- **Supabase connection**: Verify your Supabase URL and anon key
- **Database errors**: Ensure the database schema is properly set up
- **Authentication**: Check that Supabase Auth is enabled

### Common Issues
1. **Build fails with TypeScript errors**: Run `npm run build` locally to test
2. **Environment variables not working**: Check Netlify environment variable settings
3. **Database connection issues**: Verify Supabase project settings

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |

## 🎯 Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] Authentication works (sign up/sign in)
- [ ] Database operations work
- [ ] Real-time features function
- [ ] Mobile responsiveness works
- [ ] All routes are accessible

## 🔒 Security Considerations

- Never commit environment variables to your repository
- Use environment variables for all sensitive data
- Enable HTTPS (automatic with Netlify)
- Set up proper CORS settings in Supabase
- Configure Row Level Security (RLS) policies

## 📞 Support

If you encounter issues:
1. Check the Netlify build logs
2. Verify your Supabase configuration
3. Test locally with `npm run build`
4. Check the browser console for errors
