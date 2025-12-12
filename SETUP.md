# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Click on "Realtime Database" (NOT Firestore)
4. Click "Create Database"
5. Choose your location
6. Start in **test mode** (for now - you can secure it later)
7. Copy your database URL (looks like: `https://your-project-id-default-rtdb.firebaseio.com/`)

## Step 3: Get Firebase Config

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. If you don't have a web app, click "</>" icon to add one
5. Copy the config values (they look like this):
   ```javascript
   apiKey: "AIza...",
   authDomain: "your-project.firebaseapp.com",
   databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
   projectId: "your-project-id",
   storageBucket: "your-project.appspot.com",
   messagingSenderId: "123456789",
   appId: "1:123456789:web:abc123"
   ```

## Step 4: Create Environment File

1. Create a file named `.env.local` in the root directory
2. Add your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## Step 5: Configure Candidates

Edit `lib/electionData.ts`:

1. Update candidate names (replace "Candidate 1", "Member 1", etc.)
2. Update photo paths if your images have different names
3. **IMPORTANT**: Change the passwords:
   ```typescript
   export const VOTE_ENTRY_PASSWORD = 'your-secure-password-here';
   export const RESULTS_VIEW_PASSWORD = 'your-results-password-here';
   ```

## Step 6: Add Candidate Photos

1. Place all candidate photos in `public/images/` folder
2. Name them according to the pattern in `electionData.ts`:
   - Head: `head-1.jpg`, `head-2.jpg`
   - Head Assistant: `assistant-1.jpg`, `assistant-2.jpg`
   - Finance: `finance-1.jpg`, `finance-2.jpg`
   - Members: `member-1.jpg` through `member-16.jpg`
   - Under Age: `underage-1.jpg` through `underage-5.jpg`

## Step 7: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 8: Test

1. Click "Vote Entry (Tablets)" and enter the vote entry password
2. Try adding a vote to test the system
3. Open another browser/device and click "View Results" with results password
4. You should see real-time updates!

## Before the Event

1. **Test on actual tablets** - Make sure touch gestures work
2. **Test on different networks** - Verify cloud sync works
3. **Set strong passwords** - Update passwords in `electionData.ts`
4. **Backup plan** - Have a way to access Firebase console if needed
5. **Test connection** - Verify all devices can connect to Firebase

## During the Event

1. Open vote entry on 3 tablets
2. Open results page on the display screen
3. Start entering votes as the judge announces them
4. Monitor connection status indicators

## Troubleshooting

- **"Firebase not initialized"**: Check `.env.local` file exists and has correct values
- **"Permission denied"**: Check Firebase Realtime Database rules allow read/write
- **Photos not showing**: Check file names match exactly (case-sensitive)
- **Votes not updating**: Check internet connection and Firebase console for errors








