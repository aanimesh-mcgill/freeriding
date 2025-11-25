# Data Storage Documentation

## Overview

The application stores comprehensive data about each participant, their treatment conditions, and all their actions in each round. This document details exactly what information is stored and where.

## Data Storage Locations

### 1. Participants Collection (`participants`)

**Document ID**: Participant ID

**Stored Data**:
```javascript
{
  participantId: string,              // Unique participant identifier
  groupId: string,                    // Assigned group ID (same for all rounds)
  currentRound: number,               // Current round number (1-10)
  totalContribution: number,          // Sum of all contributions across rounds
  cumulativePayoff: number,           // Total payoff across all rounds
  experimentConfig: {                 // Complete treatment configuration
    infoDisplayTiming: string,        // 'eachRound' or 'endOnly'
    focalUserCondition: string,        // 'freeRider' or 'random'
    leaderboardStability: string,      // 'stable' or 'dynamic'
    socialNormDisplay: string,         // 'none', 'avgOnly', or 'avgAndStdDev'
    focalMemberTeamRank: string,      // 'high', 'middle', or 'low'
    teamLeaderboardRankingStability: string, // 'stable' or 'dynamic'
    showTeamLeaderboard: boolean,     // true or false
    showIndividualLeaderboardWithinTeam: boolean, // true or false
    showIndividualLeaderboardAcrossTeams: boolean // true or false
  },
  status: string,                     // 'active' or 'completed'
  createdAt: timestamp,               // When participant started
  lastActivity: timestamp             // Last activity timestamp
}
```

**Purpose**: Stores participant-level information and their complete treatment assignment.

---

### 2. Contributions Collection (`contributions`)

**Document ID**: Auto-generated

**Stored Data** (for each contribution decision):
```javascript
{
  participantId: string,              // Who made the contribution
  groupId: string,                    // Which group
  round: number,                      // Round number (1-10)
  contribution: number,               // Amount contributed (0 to endowment)
  endowment: number,                  // Endowment for this round
  isSimulated: boolean,              // true for simulated members, false for real
  treatmentConditions: {              // Complete treatment info at time of decision
    infoDisplayTiming: string,
    focalUserCondition: string,
    leaderboardStability: string,
    socialNormDisplay: string,
    focalMemberTeamRank: string,
    teamLeaderboardRankingStability: string,
    showTeamLeaderboard: boolean,
    showIndividualLeaderboardWithinTeam: boolean,
    showIndividualLeaderboardAcrossTeams: boolean
  },
  timestamp: timestamp,               // Server timestamp
  submittedAt: number                // Client timestamp (milliseconds)
}
```

**Purpose**: Records every contribution decision with complete treatment context. This allows analysis of how each treatment factor affected decisions.

**Note**: Both real participants and simulated team members have contributions stored here.

---

### 3. Payoffs Collection (`payoffs`)

**Document ID**: Auto-generated

**Stored Data** (for each round's payoff):
```javascript
{
  participantId: string,              // Who received the payoff
  groupId: string,                    // Which group
  round: number,                      // Round number
  contribution: number,               // Participant's contribution
  groupTotal: number,                 // Total group contribution
  groupShare: number,                 // Share from group project
  kept: number,                       // Tokens kept (endowment - contribution)
  payoff: number,                     // Total payoff for this round
  treatmentConditions: {             // Treatment info (null for simulated members)
    infoDisplayTiming: string,
    focalUserCondition: string,
    leaderboardStability: string,
    socialNormDisplay: string,
    focalMemberTeamRank: string,
    teamLeaderboardRankingStability: string,
    showTeamLeaderboard: boolean,
    showIndividualLeaderboardWithinTeam: boolean,
    showIndividualLeaderboardAcrossTeams: boolean
  },
  timestamp: timestamp                // When payoff was calculated
}
```

**Purpose**: Records calculated payoffs for each round with treatment context.

---

### 4. Groups Collection (`groups`)

**Stored Data**:
```javascript
{
  groupId: string,                    // Unique group identifier
  members: array,                     // Array of participant IDs (real participants)
  simulatedMembers: array,            // Array of simulated member IDs
  memberCount: number,                // Total number of members
  status: string,                     // 'active' or 'completed'
  createdAt: timestamp                // When group was created
}
```

**Purpose**: Tracks group composition and membership.

---

### 5. Simulated Contributions Collection (`simulatedContributions`)

**Stored Data**:
```javascript
{
  groupId: string,
  round: number,
  contributions: array,                // Base contributions before adjustment
  createdAt: timestamp
}
```

**Purpose**: Stores base simulated contributions before adjustment based on focal user's decision.

---

### 6. Rounds Collection (`rounds`)

**Stored Data**:
```javascript
{
  groupId: string,
  round: number,
  groupTotal: number,                 // Total contributions for this round
  groupShare: number,                 // Share per member
  completed: boolean,                 // Whether round is complete
  completedAt: timestamp              // When round completed
}
```

**Purpose**: Tracks round completion status and group totals.

---

## Complete Data Tracking

### What is Stored for Each Participant

1. **Treatment Assignment** (in `participants.experimentConfig`):
   - All 9 factors and their levels
   - Assigned once at experiment start
   - Never changes during experiment

2. **Each Contribution Decision** (in `contributions`):
   - Round number
   - Contribution amount
   - Complete treatment conditions at time of decision
   - Timestamp
   - Group ID

3. **Each Round's Payoff** (in `payoffs`):
   - Round number
   - Contribution amount
   - Group total
   - Individual payoff
   - Complete treatment conditions
   - Timestamp

### Data Completeness

✅ **YES** - The app stores:
- All treatment factors and levels for each participant
- All treatment information with each contribution
- All treatment information with each payoff
- Round-by-round actions
- Timestamps for all actions
- Group composition
- Simulated team member contributions

### Data Export

The admin dashboard export includes:
- Participant ID
- Group ID
- Round
- Contribution
- Group Total
- Payoff
- Cumulative Payoff
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

## Data Analysis Capabilities

With this data structure, you can:

1. **Analyze Treatment Effects**: Compare contributions across different treatment conditions
2. **Round-by-Round Analysis**: Track how decisions change across rounds
3. **Treatment Interactions**: Analyze how different factor combinations affect behavior
4. **Longitudinal Analysis**: Track individual participant trajectories
5. **Group Effects**: Analyze how group composition affects decisions
6. **Time Analysis**: Use timestamps to analyze decision-making time

## Example Queries

### Get all contributions for a participant
```javascript
db.collection('contributions')
  .where('participantId', '==', 'P001')
  .orderBy('round')
  .get()
```

### Get all participants with specific treatment
```javascript
db.collection('participants')
  .where('experimentConfig.focalUserCondition', '==', 'freeRider')
  .where('experimentConfig.showTeamLeaderboard', '==', true)
  .get()
```

### Get contributions by treatment condition
```javascript
db.collection('contributions')
  .where('treatmentConditions.focalUserCondition', '==', 'freeRider')
  .where('treatmentConditions.showTeamLeaderboard', '==', true)
  .get()
```

## Data Privacy

- Participant IDs should not contain personally identifiable information
- All data is stored in Firestore (Google Cloud)
- Data can be exported for analysis
- Admin dashboard provides access to all data

## Backup and Recovery

- All data is stored in Firestore (cloud database)
- Automatic backups by Firebase
- Can export to CSV/Excel for local backup
- Data persists even if application code changes

---

**Last Updated**: 2025  
**Data Structure Version**: 2.0

