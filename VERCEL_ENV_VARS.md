# Vercel Environment Variables

This document lists all environment variables that need to be configured in Vercel for the voting application to work correctly.

## Required Environment Variables

### Firebase Configuration (Required)

These variables are required for Firebase Realtime Database connection:

1. **NEXT_PUBLIC_FIREBASE_API_KEY**
   - Description: Firebase API Key
   - Example: `AIzaSyBQpfrBbc08cG81__h1KBK86pbQYzq0gFM`
   - Where to find: Firebase Console → Project Settings → Your apps → Web app config

2. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Description: Firebase Authentication Domain
   - Example: `vote-732f7.firebaseapp.com`
   - Where to find: Firebase Console → Project Settings → Your apps → Web app config

3. **NEXT_PUBLIC_FIREBASE_DATABASE_URL**
   - Description: Firebase Realtime Database URL
   - Example: `https://vote-732f7-default-rtdb.firebaseio.com`
   - Where to find: Firebase Console → Realtime Database → Data tab → URL at top
   - Note: Should NOT end with a trailing slash

4. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Description: Firebase Project ID
   - Example: `vote-732f7`
   - Where to find: Firebase Console → Project Settings → General tab

5. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Description: Firebase Storage Bucket
   - Example: `vote-732f7.firebasestorage.app`
   - Where to find: Firebase Console → Project Settings → Your apps → Web app config

6. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Description: Firebase Messaging Sender ID
   - Example: `139607071592`
   - Where to find: Firebase Console → Project Settings → Your apps → Web app config

7. **NEXT_PUBLIC_FIREBASE_APP_ID**
   - Description: Firebase App ID
   - Example: `1:139607071592:web:738a931e5ccce1715954dd`
   - Where to find: Firebase Console → Project Settings → Your apps → Web app config

## Optional Environment Variables

### Passwords (Currently Hardcoded)

Currently, passwords are defined in `lib/electionData.ts`. For better security, you can optionally move them to environment variables:

- **VOTE_ENTRY_PASSWORD** (optional - currently in code)
- **RESULTS_VIEW_PASSWORD** (optional - currently in code)
- **TOP_VOTE_PASSWORD** (optional - currently in code)
- **OTHER_VOTE_PASSWORD** (optional - currently in code)

**Note:** If you want to use environment variables for passwords, you'll need to update `lib/electionData.ts` to read from `process.env` instead of hardcoded values.

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value**: The actual value
   - **Environment**: Select which environments (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application for changes to take effect

## Important Notes

- All `NEXT_PUBLIC_*` variables are exposed to the browser/client-side code
- Never commit `.env.local` files to git (they're already in `.gitignore`)
- The application has fallback values hardcoded in `lib/firebase.ts`, but it's recommended to use environment variables for production
- After adding environment variables in Vercel, you must redeploy for them to take effect

## Current Status

✅ **Required for Vercel:**
- All 7 Firebase configuration variables listed above

⚠️ **Optional but Recommended:**
- Consider moving passwords to environment variables for better security

## Verification

After setting up environment variables in Vercel:

1. Deploy your application
2. Check the browser console for any Firebase initialization errors
3. Test the connection status indicator on each page
4. Verify that votes are syncing correctly across devices

