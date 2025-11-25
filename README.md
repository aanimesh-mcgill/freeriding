# Decision-Making Experiment Application

A comprehensive web application for conducting decision-making experiments based on public goods game design. This application implements configurable treatment conditions, simulated team members, and real-time leaderboards to study individual decision-making in group settings.

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

### Factor 2: Focal User Contribution Level (Between-Subject)

**Description**: The focal (real) participant's rank position within their team across rounds.

**Levels**:
- **85% Rounds Lower**: Focal user is in the bottom 3 ranks (ranks 4, 5, or 6 out of 6) in 85% of rounds
  - Simulated members are adjusted to ensure at least 3 members rank above the focal user
  - Target rank is randomly selected from ranks 4, 5, or 6 for each round
  - 15% of rounds allow variation (user can be anywhere)
- **85% Rounds Higher**: Focal user is in the top 3 ranks (ranks 1, 2, or 3 out of 6) in 85% of rounds
  - Simulated members are adjusted to ensure at least 3 members rank below the focal user
  - Target rank is randomly selected from ranks 1, 2, or 3 for each round
  - 15% of rounds allow variation (user can be anywhere)

**Default**: 85% Rounds Lower

**Implementation**: Simulated team member contributions are adjusted based on focal user's actual contribution to ensure the user achieves the target rank position (top 3 or bottom 3) in 85% of rounds.

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
- **Average Only**: Shows team average contribution (standard deviation is calculated but not displayed)
- **Average + Std Deviation**: Shows both average and standard deviation (legacy option, currently only average is shown)

**Default**: None

**Display Location**: 
- In the decision tab (if timing is "each round")
- In the leaderboard tab
- After round results

**Social Norm Average Logic**:
- **High Team Rank Condition**: Target average is 16 tokens (configurable via admin, default: 16)
- **Low Team Rank Condition**: Target average is 6 tokens (configurable via admin, default: 6)
- **Variation**: +/-2 tokens variation is applied to the target average
- **Individual Contributions**: Simulated team member contributions are adjusted to achieve the target average
- **Admin Configuration**: Administrators can set:
  - `socialNormAverageHigh`: Target average for high team rank (default: 16)
  - `socialNormAverageLow`: Target average for low team rank (default: 6)
  - `socialNormStdDev`: Standard deviation for calculations (not displayed to users)

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

### Factor 8: Focal Member Team Rank

**Description**: Where the focal user's team appears in the team leaderboard.

**Levels**:
- **High**: Focal user's team appears at the top of the team leaderboard
- **Middle**: Focal user's team appears in the middle of the team leaderboard
- **Low**: Focal user's team appears at the bottom of the team leaderboard

**Default**: Middle

**Implementation**: Simulated teams are created with adjusted total contributions to position the focal team at the desired rank. The focal team is highlighted in the leaderboard.

---

### Factor 9: Team Leaderboard Ranking Stability

**Description**: Whether the focal team's position in the team leaderboard changes across rounds.

**Levels**:
- **Stable**: Focal team's position stays the same across all rounds
  - If set to "high", team stays at top throughout
  - If set to "middle", team stays in middle throughout
  - If set to "low", team stays at bottom throughout
- **Dynamic**: Focal team's position changes across rounds
  - Position varies based on round number
  - Creates more uncertainty about team performance

**Default**: Stable

**Implementation**: For dynamic condition, team position cycles through different ranks based on round number while maintaining the general rank category (high/middle/low).

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

- **Team Statistics**: Shows team average only (standard deviation is calculated but not displayed)
- **Condition-Based Average**: Average is set based on team rank condition:
  - High team rank: 16 tokens (with +/-2 variation)
  - Low team rank: 6 tokens (with +/-2 variation)
- **Admin Configurable**: Administrators can set target averages for high/low team ranks
- **Individual Contribution Adjustment**: Simulated contributions are adjusted to achieve target average
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

#### Adjustment Based on Focal User Contribution Level

**85% Rounds Lower (Bottom 3)**:
```
Target Rank: Randomly select rank 4, 5, or 6
Number of Members Above User: targetRank - 1 (3, 4, or 5 members)
- Top numMembersAboveUser simulated members: contribute 3-8 tokens more than user
- Remaining simulated members: contribute 0-3 tokens less than user
- Ensures user ranks in bottom 3 (ranks 4, 5, or 6)
```

**85% Rounds Higher (Top 3)**:
```
Target Rank: Randomly select rank 1, 2, or 3
Number of Members Above User: targetRank - 1 (0, 1, or 2 members)
- Top numMembersAboveUser simulated members: contribute 1-4 tokens more than user
- Remaining simulated members: contribute 3-8 tokens less than user
- Ensures user ranks in top 3 (ranks 1, 2, or 3)
```

**Compliance Tracking**:
- Tracks rounds to ensure 85% compliance
- 15% of rounds allow variation (user can be anywhere)
- Compliance is calculated per round to maintain overall 85% target

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

**Target Average (Condition-Based)**:
```
If teamContribution === 'high':
  targetAvg = socialNormAverageHigh (default: 16)
Else:
  targetAvg = socialNormAverageLow (default: 6)

Variation: targetAvg + random(-2 to +2)
Final Target = clamp(targetAvg + variation, 0, endowment)
```

**Individual Contribution Adjustment**:
```
Total Needed = (Final Target × Group Size) - Focal User Contribution
Average Per Simulated = Total Needed / Number of Simulated Members
Each Simulated Contribution = Average Per Simulated + random(-1 to +1)
Adjust to ensure total matches target exactly
```

**Display**:
- Only team average is displayed to users
- Standard deviation is calculated but not shown
- Average is calculated from actual contributions (which are adjusted to match target)

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
   
5. **Social Norm Average (High Team Rank)**
   - Set target average when team rank is high (default: 16)
   - With +/-2 variation applied
   
6. **Social Norm Average (Low Team Rank)**
   - Set target average when team rank is low (default: 6)
   - With +/-2 variation applied
   
7. **Social Norm Standard Deviation**
   - Set standard deviation for calculations (not displayed to users)

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
- `groupId` (string): Assigned group ID (same for all rounds)
- `currentRound` (number): Current round number
- `totalContribution` (number): Sum of all contributions
- `cumulativePayoff` (number): Total payoff across all rounds
- `experimentConfig` (object): **Complete treatment configuration with all 9 factors**:
  - `infoDisplayTiming`: 'eachRound' or 'endOnly'
  - `focalUserCondition`: 'freeRider' or 'random'
  - `leaderboardStability`: 'stable' or 'dynamic'
  - `socialNormDisplay`: 'none', 'avgOnly', or 'avgAndStdDev'
  - `focalMemberTeamRank`: 'high', 'middle', or 'low'
  - `teamLeaderboardRankingStability`: 'stable' or 'dynamic'
  - `showTeamLeaderboard`: boolean
  - `showIndividualLeaderboardWithinTeam`: boolean
  - `showIndividualLeaderboardAcrossTeams`: boolean
- `status` (string): 'active' or 'completed'
- `createdAt` (timestamp): When participant started
- `lastActivity` (timestamp): Last activity time

#### `contributions`
- `participantId` (string): Who made the contribution
- `groupId` (string): Which group
- `round` (number): Round number (1-10)
- `contribution` (number): Amount contributed (0 to endowment)
- `endowment` (number): Endowment for this round
- `isSimulated` (boolean): Whether this is a simulated member
- `treatmentConditions` (object): **Complete treatment information at time of decision** (same structure as experimentConfig)
- `timestamp` (timestamp): Server timestamp
- `submittedAt` (number): Client timestamp (milliseconds)

#### `payoffs`
- `participantId` (string): Who received the payoff
- `groupId` (string): Which group
- `round` (number): Round number
- `contribution` (number): Participant's contribution
- `groupTotal` (number): Total group contribution
- `groupShare` (number): Share from group project
- `kept` (number): Tokens kept (endowment - contribution)
- `payoff` (number): Total payoff for this round
- `treatmentConditions` (object): **Complete treatment information** (null for simulated members)
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
  - **Basic Settings**: `totalRounds`, `roundDuration`, `groupSize`, `endowment`, `multiplier`, `resultsDelay`
  - **All 9 Treatment Factors**:
    - `infoDisplayTiming`: 'eachRound' or 'endOnly'
    - `focalUserCondition`: 'freeRider' or 'random'
    - `leaderboardStability`: 'stable' or 'dynamic'
    - `socialNormDisplay`: 'none', 'avgOnly', or 'avgAndStdDev'
    - `focalMemberTeamRank`: 'high', 'middle', or 'low'
    - `teamLeaderboardRankingStability`: 'stable' or 'dynamic'
    - `showTeamLeaderboard`: boolean
    - `showIndividualLeaderboardWithinTeam`: boolean
    - `showIndividualLeaderboardAcrossTeams`: boolean
  - `updatedAt`: When settings were last updated

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

## Data Tracking and Analysis

### Complete Treatment Tracking

**Every action stores complete treatment information**:

1. **Participant Assignment**: Stored in `participants.experimentConfig`
2. **Each Contribution**: Stored in `contributions.treatmentConditions`
3. **Each Payoff**: Stored in `payoffs.treatmentConditions`

This ensures:
- Complete data for analysis
- Ability to track treatment effects
- Round-by-round treatment context
- Data integrity even if settings change

### Data Export

The admin dashboard export includes:
- All participant actions (contributions, payoffs)
- **All 9 treatment factors as separate columns**:
  - Info Timing
  - Focal Condition
  - LB Stability
  - Social Norm
  - Team Rank
  - Team Rank Stability
  - Team LB (Y/N)
  - Ind LB Team (Y/N)
  - Ind LB All (Y/N)

See `DATA_STORAGE.md` for complete data structure documentation.

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
