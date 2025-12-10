# Deployment Guide

## Vercel Deployment

### Prerequisites
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Firebase project configured
- GitHub repository with your code

### Step 1: Environment Variables

Before deploying, you need to set up environment variables in Vercel:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables (get values from Firebase Console):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will automatically detect Next.js
4. Add environment variables (from Step 1)
5. Click **Deploy**

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### Step 3: Configure Firebase Database Rules

Make sure your Firebase Realtime Database rules allow read/write access:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Note:** For production, consider adding authentication-based rules.

### Step 4: Verify Deployment

1. Check that your site is accessible
2. Test the vote entry page
3. Test the results page
4. Verify real-time updates work

### Troubleshooting

- **Build fails**: Check that all environment variables are set correctly
- **Firebase connection issues**: Verify Firebase configuration and database rules
- **Images not loading**: Ensure images are in the `public/images/` folder

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your Firebase credentials
3. Run `npm install`
4. Run `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

