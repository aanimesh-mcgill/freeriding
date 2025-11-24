# Quick Setup Guide

## Initial Setup Steps

### 1. Firebase Configuration
The Firebase configuration is already set in `app.js` and `admin.js`. If you need to use a different Firebase project, update the `firebaseConfig` object in both files.

### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Initialize Experiment Settings (Optional)
The app will use default settings if none are found in Firestore. To set custom settings:

1. Open the admin dashboard (`admin.html`)
2. Adjust settings in the "Experiment Settings" section
3. Click "Save Settings"

Or manually create in Firestore:
- Collection: `settings`
- Document ID: `experiment`
- Fields:
  - `totalRounds`: 10 (number)
  - `roundDuration`: 120 (number, seconds)
  - `groupSize`: 4 (number)
  - `endowment`: 20 (number, tokens)
  - `multiplier`: 1.6 (number)

### 4. Test the Application

1. **Test Participant Flow**:
   - Open `index.html`
   - Enter a test Participant ID (e.g., "TEST001")
   - Complete a round to verify everything works

2. **Test Admin Dashboard**:
   - Open `admin.html`
   - Verify you can see statistics and participant data
   - Test the export functionality

### 5. Hosting Options

#### Option A: Firebase Hosting (Recommended)
```bash
firebase deploy --only hosting
```

#### Option B: OneDrive
1. Upload all files to OneDrive folder
2. Create shareable link with "Anyone with the link can view"
3. Share link with participants

**Note**: OneDrive may have limitations with JavaScript. Test thoroughly before using for actual experiments.

#### Option C: Other Web Hosting
Upload all files to any web hosting service that supports static HTML/JS/CSS.

## Testing Checklist

- [ ] Firebase connection works
- [ ] Participant can start experiment
- [ ] Treatment conditions are randomized
- [ ] Timer counts down correctly
- [ ] Contribution submission works
- [ ] Round completion triggers payoff calculation
- [ ] Leaderboards display correctly (if treatment enabled)
- [ ] Contribution comparison shows correctly (if treatment enabled)
- [ ] Admin dashboard loads data
- [ ] Export to Excel works
- [ ] Settings can be saved and loaded

## Common First-Time Issues

1. **"Permission denied" errors**: Deploy Firestore rules
2. **Settings not loading**: Create settings document in Firestore or use defaults
3. **Groups not forming**: Check Firestore permissions for groups collection
4. **Timer not working**: Check browser console for JavaScript errors

## Next Steps

1. Test with a small group (2-4 participants)
2. Verify data is being saved correctly in Firestore
3. Test all treatment conditions
4. Verify payoff calculations are correct
5. Test admin dashboard export functionality
6. Conduct pilot study before full experiment

