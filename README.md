# Club Election Voting System

Real-time election vote counting and live results display system for club board elections.

## Features

- **Vote Entry Interface**: Touch-friendly tablet interface for 3 members to enter votes in real-time
- **Live Results Display**: Real-time results page showing rankings, percentages, and winners
- **Quick Entry Gestures**: 
  - Double-tap or single tap for +1 vote
  - Long-press for -1 vote (correction)
- **Real-time Sync**: Firebase Realtime Database ensures instant updates across all devices
- **Grouped Elections**: Support for multiple election groups with different winner counts
- **Password Protection**: Separate passwords for vote entry and results viewing

## Election Structure

The system supports 5 election groups:
1. **Head**: 2 candidates, 1 winner
2. **Head Assistant**: 2 candidates, 1 winner
3. **Finance**: 2 candidates, 1 winner
4. **Members**: 16 candidates, 5 winners
5. **Under Age**: 5 candidates, 2 winners

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Realtime Database** (not Firestore)
3. Set database rules to allow read/write (for production, you should add authentication):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
4. Copy your Firebase configuration from Project Settings
5. Create a `.env.local` file (copy from `.env.example`) and add your Firebase credentials

### 3. Configure Candidates

Edit `lib/electionData.ts` to:
- Update candidate names
- Update photo paths (place images in `public/images/`)
- Set passwords for vote entry and results viewing

### 4. Add Candidate Photos

Place candidate photos in `public/images/` with the following naming:
- Head: `head-1.jpg`, `head-2.jpg`
- Head Assistant: `assistant-1.jpg`, `assistant-2.jpg`
- Finance: `finance-1.jpg`, `finance-2.jpg`
- Members: `member-1.jpg` through `member-16.jpg`
- Under Age: `underage-1.jpg` through `underage-5.jpg`

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Vote Entry (Tablets)

1. Navigate to the home page
2. Click "Vote Entry (Tablets)"
3. Enter the vote entry password
4. Select the election group tab
5. Tap candidate cards to add votes:
   - **Single tap or double tap**: +1 vote
   - **Long press**: -1 vote (correction)
   - **-1 button**: Manual subtraction

### View Results

1. Navigate to the home page
2. Click "View Results"
3. Enter the results viewing password
4. Watch live updates as votes are entered
5. Winners are automatically highlighted when they reach winning positions

## Technical Details

- **Framework**: Next.js 14 (App Router)
- **Database**: Firebase Realtime Database
- **Styling**: Tailwind CSS
- **Real-time Updates**: Firebase Realtime Database listeners
- **Responsive**: Works on tablets and desktop screens

## Important Notes

- The system is designed for a 9-hour counting session
- All data is stored in Firebase Realtime Database
- Connection status is displayed on both entry and results pages
- Vote entries are logged for audit purposes
- The system automatically handles reconnection if connection drops

## Security Considerations

For production use, consider:
- Implementing proper Firebase Authentication
- Adding database security rules based on user roles
- Using environment variables for sensitive data
- Adding rate limiting for vote entries
- Implementing audit logging

## Troubleshooting

- **Connection issues**: Check Firebase configuration and internet connection
- **Photos not loading**: Ensure images are in `public/images/` with correct names
- **Votes not updating**: Check Firebase database rules and connection status







