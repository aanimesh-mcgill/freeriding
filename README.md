# Free-Riding Experiment Application

A comprehensive web application for conducting free-riding experiments based on public goods game design. This application implements configurable treatment conditions, simulated team members, and real-time leaderboards to study individual decision-making in group settings.

## Table of Contents

- [Overview](#overview)
- [Experiment Design](#experiment-design)
- [Factors and Levels](#factors-and-levels)
- [Features](#features)
- [Experiment Logic](#experiment-logic)
- [Setup Instructions](#setup-instructions)
- [Admin Configuration](#admin-configuration)
- [Data Structure](#data-structure)
- [Deployment](#deployment)

## Overview

This application conducts a multi-round public goods game where participants decide how many tokens to contribute to a group project. The experiment includes:

- **Consent Form**: Ethical consent before participation
- **Same Team**: Participants remain with the same team for all rounds
- **Simulated Team Members**: AI-generated team members based on experimental conditions
- **Configurable Factors**: All experimental factors can be configured by administrators
- **Real-time Leaderboards**: Dynamic leaderboards that update as decisions are made
- **Social Norm Display**: Team statistics (average, standard deviation) based on configuration

## Experiment Design

### Game Mechanics

- **Endowment**: Each participant receives a fixed number of tokens per round (default: 20)
- **Contribution Decision**: Participants choose how many tokens (0 to endowment) to contribute
- **Group Project**: Contributed tokens are multiplied and shared equally among all group members
- **Multiplier**: Default 1.6 (1 token contributed becomes 1.6 tokens shared)
- **Payoff Formula**: `Payoff = (Endowment - Contribution) + (Group Total × Multiplier) / Group Size`

### Example Calculation

If a participant contributes 10 tokens and their group of 4 contributes 40 tokens total:
- Tokens kept: 10
- Group share: (40 × 1.6) / 4 = 16
- **Total payoff: 26 tokens**

### Round Structure

1. Participant views round number and timer
2. Makes contribution decision (0 to endowment)
3. Submits decision
4. Simulated team members' contributions are generated
5. Results are calculated and displayed
6. Leaderboards and social norms are shown (if enabled)
7. Proceeds to next round

## Factors and Levels

### Factor 1: Info Display Timing

**Description**: When information (leaderboards, social norms) is displayed to participants.

**Levels**:
- **Each Round**: Information is shown after each round's submission
- **End Only**: Information is shown only at the end of all rounds

**Default**: Each Round

---

### Factor 2: Focal User Condition

**Description**: How the focal (real) participant's contribution compares to simulated team members.

**Levels**:
- **Free Rider**: Focal user always contributes significantly less than team average
  - Simulated members contribute 40% more on average than focal user
  - Creates consistent free-riding scenario
- **Random**: Focal user's position varies randomly
  - Sometimes higher than average (33% chance)
  - Sometimes lower than average (33% chance)
  - Sometimes similar to average (33% chance)

**Default**: Random

**Implementation**: Simulated team member contributions are adjusted based on focal user's actual contribution to maintain the condition.

---

### Factor 3: Leaderboard Stability

**Description**: How leaderboard rankings change across rounds.

**Levels**:
- **Stable**: Relative ranks remain consistent
  - Top contributors stay at top
  - Lower contributors stay at bottom
  - Rankings are predictable
- **Dynamic**: Relative ranks change frequently
  - Rankings vary from round to round
  - Creates more uncertainty
  - Simulated members' contributions vary more

**Default**: Stable

**Implementation**: Affects how simulated team member contributions are generated across rounds.

---

### Factor 4: Social Norm Display

**Description**: What team statistics are shown to participants.

**Levels**:
- **None**: No social norm information is displayed
- **Average Only**: Shows team average contribution
- **Average + Std Deviation**: Shows both average and standard deviation

**Default**: None

**Display Location**: 
- In the decision tab (if timing is "each round")
- In the leaderboard tab
- After round results

---

### Factor 5: Team Leaderboard

**Description**: Whether to show rankings of teams by total contributions.

**Levels**:
- **Enabled**: Shows team leaderboard
- **Disabled**: Does not show team leaderboard

**Default**: Disabled

**Display**: Shows top 10 teams ranked by total contributions across all rounds.

---

### Factor 6: Individual Leaderboard (Within Team)

**Description**: Whether to show rankings of individuals within the participant's own team.

**Levels**:
- **Enabled**: Shows individual rankings within team
- **Disabled**: Does not show within-team rankings

**Default**: Disabled

**Display**: Shows all team members (including simulated) ranked by total contributions.

---

### Factor 7: Individual Leaderboard (Across All Teams)

**Description**: Whether to show rankings of all participants across all teams.

**Levels**:
- **Enabled**: Shows individual rankings across all teams
- **Disabled**: Does not show cross-team rankings

**Default**: Disabled

**Display**: Shows top 20 participants ranked by total contributions.

---

## Features

### 1. Consent Management

- **Consent Form**: Participants must read and agree to participate
- **Ethical Compliance**: Includes study information, risks, benefits, confidentiality
- **Required Checkbox**: Cannot proceed without consent

### 2. Participant Management

- **Participant ID**: Unique identifier for each participant
- **Session Continuity**: Participants can resume from where they left off
- **Progress Tracking**: Tracks current round, total contributions, cumulative payoffs

### 3. Group Formation

- **Same Team**: Participants stay with the same group for all rounds
- **Automatic Assignment**: Groups are formed automatically
- **Group Size**: Configurable (default: 4 members total, 1 real + 3 simulated)

### 4. Simulated Team Members

- **Automatic Generation**: 3 simulated team members per group
- **Condition-Based**: Contributions adjust based on focal user condition
- **Realistic Behavior**: Contributions vary based on stability setting
- **Transparent**: Simulated members are clearly labeled in leaderboards

### 5. Real-time Updates

- **Live Leaderboards**: Update automatically as contributions are made
- **Real-time Listeners**: Firestore listeners for instant updates
- **Smooth Transitions**: UI updates without page refresh

### 6. Timer System

- **Configurable Duration**: Round duration can be set (default: 120 seconds)
- **Visual Countdown**: Timer displays remaining time
- **Auto-Submit**: Automatically submits if time expires
- **Warning States**: Visual warnings when time is running low

### 7. Results Display

- **Configurable Delay**: Delay before showing results (default: 3 seconds)
- **Comprehensive Results**: Shows contribution, group total, share, payoff, cumulative
- **No Scrolling Required**: Results appear on same screen
- **Smooth Animations**: Smooth transitions between states

### 8. Leaderboard Tab

- **Dedicated View**: Separate tab for leaderboards
- **Multiple Types**: Can show team, within-team, and cross-team leaderboards
- **Auto-Switch**: Automatically switches to leaderboard tab after submission (if enabled)
- **Real-time Updates**: Updates as new contributions are made

### 9. Social Norm Display

- **Team Statistics**: Shows team average and/or standard deviation
- **Configurable**: Can be enabled/disabled and customized
- **Multiple Locations**: Shown in decision tab, leaderboard tab, and results

### 10. Admin Dashboard

- **Real-time Monitoring**: View all participants and their progress
- **Statistics Overview**: Total participants, contributions, payoffs, averages
- **Round-by-Round Data**: Detailed view of all contributions per round
- **Treatment Distribution**: View how many participants received each treatment
- **Data Export**: Export all data to CSV/Excel format
- **Experiment Configuration**: Configure all factors and settings
- **Reset Functionality**: Ability to reset experiment (with confirmation)

## Experiment Logic

### Flow Diagram

```
1. Consent Form
   ↓
2. Welcome/Instructions
   ↓
3. Enter Participant ID
   ↓
4. Start Experiment
   ├─→ Check if existing participant
   │   ├─→ Yes: Load existing data, resume from current round
   │   └─→ No: Create new participant
   │       ├─→ Assign to group (or create new)
   │       ├─→ Generate simulated team members
   │       └─→ Store experiment config
   ↓
5. For Each Round (1 to Total Rounds):
   ├─→ Display round number and timer
   ├─→ Participant makes contribution decision
   ├─→ Submit contribution
   │   ├─→ Save focal user contribution
   │   ├─→ Generate simulated team contributions
   │   │   ├─→ Based on focal user condition
   │   │   └─→ Based on leaderboard stability
   │   ├─→ Calculate payoffs for all members
   │   └─→ Save all contributions and payoffs
   ├─→ Wait for configured delay
   ├─→ Display results
   ├─→ Show leaderboards (if enabled and timing = each round)
   ├─→ Show social norm (if enabled)
   └─→ Proceed to next round
   ↓
6. End Screen
   ├─→ Show final statistics
   └─→ Mark participant as completed
```

### Simulated Team Member Logic

#### Base Contribution Generation

For each simulated team member:
- **Stable Condition**: Contributions follow a rank-based pattern (7-15 tokens)
- **Dynamic Condition**: Contributions vary randomly (8-15 tokens)

#### Adjustment Based on Focal User Condition

**Free Rider Condition**:
```
Target Average = Focal User Contribution + (Endowment × 0.4)
Adjustment = Target Average - Base Average
Adjusted Contribution = Base Contribution + Adjustment
```

**Random Condition**:
```
Random Factor (0-1):
  - < 0.33: Focal user higher → Simulated slightly lower
  - 0.33-0.66: Focal user lower → Simulated slightly higher
  - > 0.66: Focal user similar → Keep similar
Adjustment = (Focal User - Base Average) × 0.8
Adjusted Contribution = Base Contribution + Adjustment
```

### Payoff Calculation

For each participant (focal user and simulated):
1. Calculate group total: Sum of all contributions
2. Calculate group share: `(Group Total × Multiplier) / Group Size`
3. Calculate kept tokens: `Endowment - Contribution`
4. Calculate payoff: `Kept + Group Share`
5. Update cumulative payoff

### Leaderboard Calculation

**Team Leaderboard**:
- Sum all contributions per group across all rounds
- Sort by total (descending)
- Display top 10

**Individual Leaderboard (Within Team)**:
- Sum contributions per team member for current group
- Sort by total (descending)
- Display all members

**Individual Leaderboard (Across Teams)**:
- Sum contributions per participant (excluding simulated)
- Sort by total (descending)
- Display top 20

### Social Norm Calculation

**Average**:
```
Average = Sum of all contributions / Number of team members
```

**Standard Deviation**:
```
Variance = Σ(Contribution - Average)² / Number of members
Standard Deviation = √Variance
```

## Setup Instructions

### Prerequisites

- Firebase project with Firestore enabled
- Firebase Hosting (optional, can also use OneDrive)
- Modern web browser

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create project: `freeriding-a0ae7` (or use your own)

2. **Enable Firestore**
   - In Firebase Console → Firestore Database
   - Create database in production mode
   - Deploy security rules: `firebase deploy --only firestore:rules`

3. **Configure API Key Restrictions** (Important for Security)
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=freeriding-a0ae7)
   - Find your API key
   - Set Application Restrictions: HTTP referrers
   - Add: `https://freeriding-a0ae7.web.app/*`, `https://freeriding-a0ae7.firebaseapp.com/*`
   - Set API Restrictions: Only Cloud Firestore API and Firebase Installations API

### Local Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/aanimesh-mcgill/freeriding.git
   cd freeriding
   ```

2. **Install Firebase CLI** (for deployment)
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Test Locally**
   - Open `index.html` in a web browser
   - Test with a sample participant ID

### Deployment

#### Option 1: Firebase Hosting (Recommended)

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy hosting
firebase deploy --only hosting
```

Your app will be live at:
- Main: `https://freeriding-a0ae7.web.app`
- Admin: `https://freeriding-a0ae7.web.app/admin`

#### Option 2: OneDrive

1. Upload all files to OneDrive folder
2. Create shareable link with "Anyone with the link can view"
3. Share link with participants

**Note**: OneDrive may have limitations with JavaScript execution.

### CI/CD Setup

The repository includes GitHub Actions for automatic deployment:

1. **Get Firebase CI Token**
   ```bash
   firebase login:ci
   ```

2. **Add Token to GitHub Secrets**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add secret: `FIREBASE_TOKEN` with the token from step 1

3. **Automatic Deployment**
   - Every push to `main` branch triggers deployment
   - Can also manually trigger from Actions tab

## Admin Configuration

### Accessing Admin Dashboard

Navigate to: `https://freeriding-a0ae7.web.app/admin`

### Configuring Experiment Settings

#### Basic Settings

- **Total Rounds**: Number of rounds (default: 10)
- **Round Duration**: Time per round in seconds (default: 120)
- **Group Size**: Total group size including focal user (default: 4)
- **Endowment**: Tokens per round (default: 20)
- **Multiplier**: Group project multiplier (default: 1.6)
- **Results Delay**: Seconds to wait before showing results (default: 3)

#### Experiment Factors

1. **Info Display Timing**
   - Select: "Each Round" or "End Only"

2. **Focal User Condition**
   - Select: "Free Rider" or "Random"

3. **Leaderboard Stability**
   - Select: "Stable" or "Dynamic"

4. **Social Norm Display**
   - Select: "None", "Average Only", or "Average + Std Deviation"

#### Information Display Options

Check/uncheck:
- ☑ Show Team Leaderboard
- ☑ Show Individual Leaderboard (Within Team)
- ☑ Show Individual Leaderboard (Across All Teams)

### Saving Settings

1. Configure all settings
2. Click "Save Settings"
3. Settings are saved to Firestore
4. New participants will use updated settings

### Monitoring Experiment

- **Statistics Overview**: Real-time statistics
- **Participants Table**: View all participants and their progress
- **Groups Overview**: See all groups and their members
- **Round-by-Round Data**: Detailed contribution data
- **Treatment Distribution**: See how many participants have each treatment

### Exporting Data

1. Click "Export to Excel"
2. CSV file downloads with all experiment data
3. Includes: Participant ID, Group, Round, Contribution, Payoff, Treatment Conditions

## Data Structure

### Firestore Collections

#### `participants`
- `participantId` (string): Unique participant identifier
- `groupId` (string): Assigned group ID
- `currentRound` (number): Current round number
- `totalContribution` (number): Sum of all contributions
- `cumulativePayoff` (number): Total payoff across all rounds
- `experimentConfig` (object): Experiment configuration for this participant
- `status` (string): 'active' or 'completed'
- `createdAt` (timestamp): When participant started
- `lastActivity` (timestamp): Last activity time

#### `contributions`
- `participantId` (string): Who made the contribution
- `groupId` (string): Which group
- `round` (number): Round number
- `contribution` (number): Amount contributed
- `endowment` (number): Endowment for this round
- `isSimulated` (boolean): Whether this is a simulated member
- `timestamp` (timestamp): When contribution was made

#### `payoffs`
- `participantId` (string): Who received the payoff
- `groupId` (string): Which group
- `round` (number): Round number
- `contribution` (number): Participant's contribution
- `groupTotal` (number): Total group contribution
- `groupShare` (number): Share from group project
- `kept` (number): Tokens kept
- `payoff` (number): Total payoff for this round
- `timestamp` (timestamp): When payoff was calculated

#### `groups`
- `groupId` (string): Unique group identifier
- `members` (array): Array of participant IDs
- `simulatedMembers` (array): Array of simulated member IDs
- `memberCount` (number): Total number of members
- `status` (string): 'active' or 'completed'
- `createdAt` (timestamp): When group was created

#### `simulatedContributions`
- `groupId` (string): Which group
- `round` (number): Round number
- `contributions` (array): Array of contribution objects
- `createdAt` (timestamp): When generated

#### `rounds`
- `groupId` (string): Which group
- `round` (number): Round number
- `groupTotal` (number): Total contributions
- `groupShare` (number): Share per member
- `completed` (boolean): Whether round is complete
- `completedAt` (timestamp): When completed

#### `settings`
- Document ID: `experiment`
- Contains all experiment configuration:
  - `totalRounds`, `roundDuration`, `groupSize`, `endowment`, `multiplier`
  - `resultsDelay`
  - `infoDisplayTiming`, `focalUserCondition`, `leaderboardStability`
  - `socialNormDisplay`
  - `showTeamLeaderboard`, `showIndividualLeaderboardWithinTeam`, `showIndividualLeaderboardAcrossTeams`

## Deployment

### Firebase Hosting

The application is configured for Firebase Hosting. After deployment:

- **Main App**: `https://freeriding-a0ae7.web.app`
- **Admin Dashboard**: `https://freeriding-a0ae7.web.app/admin`

### CI/CD Pipeline

Automatic deployment via GitHub Actions:
- Triggers on push to `main` branch
- Deploys Firestore rules
- Deploys Firebase Hosting
- See `.github/workflows/deploy.yml` for configuration

### Security

- **Firestore Rules**: Configured in `firestore.rules`
- **API Key Restrictions**: Must be configured in Google Cloud Console
- **Data Privacy**: Participant IDs should not contain PII

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Deploy Firestore rules: `firebase deploy --only firestore:rules`
   - Check rules in Firebase Console

2. **Simulated members not appearing**
   - Check that `generateSimulatedTeamContributions` ran
   - Verify group has `simulatedMembers` array

3. **Leaderboards not updating**
   - Check experiment config in Firestore
   - Verify `infoDisplayTiming` is set correctly
   - Check browser console for errors

4. **Results not showing**
   - Check `resultsDelay` setting
   - Verify payoffs were calculated
   - Check browser console for errors

## File Structure

```
freeriding/
├── index.html              # Main experiment interface
├── admin.html              # Admin dashboard
├── app.js                  # Experiment logic (1150+ lines)
├── admin.js                # Admin dashboard logic
├── style.css               # Styling
├── firebase.json           # Firebase configuration
├── firestore.rules         # Security rules
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
└── README.md               # This file
```

## References

Based on experimental design from:
- "Individual Behaviour in a Free Riding Experiment" by Joachim Weimann
- Standard public goods game experimental design

## License

This project is for research purposes. Ensure compliance with your institution's research ethics guidelines.

## Support

For issues or questions:
- Check GitHub repository: https://github.com/aanimesh-mcgill/freeriding
- Review Firebase documentation
- Check browser console for errors

---

**Version**: 2.0  
**Last Updated**: 2025  
**Status**: Production Ready
