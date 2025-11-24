# Free-Riding Experiment Application

A comprehensive web application for conducting free-riding experiments based on public goods game design. This application implements treatment conditions (team leaderboards, individual leaderboards, contribution comparisons) and includes features for group formation, payoff calculations, timers, and an admin dashboard.

## Features

### Experiment Features
- **Multi-round Public Goods Game**: Participants contribute tokens to a group project over multiple rounds
- **Treatment Randomization**: Each participant is randomly assigned treatment conditions:
  - Team Leaderboard (shows group rankings)
  - Individual Leaderboard (shows individual participant rankings)
  - Contribution Comparison (shows contribution vs team average)
- **Group Formation**: Automatic assignment of participants to groups
- **Real-time Leaderboards**: Dynamic leaderboards that update as participants make decisions
- **Round Timers**: Configurable timers for each round with auto-submit functionality
- **Payoff Calculations**: Automatic calculation of payoffs based on contributions and group totals
- **Next Round Auto-lock**: Rounds automatically lock when all group members have submitted

### Admin Dashboard
- **Real-time Monitoring**: View all participants, groups, and contributions in real-time
- **Statistics Overview**: Total participants, contributions, payoffs, and averages
- **Round-by-Round Data**: Detailed view of all contributions and payoffs per round
- **Treatment Distribution**: View how many participants received each treatment condition
- **Data Export**: Export all experiment data to CSV/Excel format
- **Experiment Settings**: Configure rounds, duration, group size, endowment, and multiplier
- **Reset Functionality**: Ability to reset the experiment (with confirmation)

## Setup Instructions

### Prerequisites
- A Firebase project with Firestore enabled
- Firebase configuration credentials

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing project `freeriding-a0ae7`

2. **Enable Firestore**
   - In Firebase Console, go to Firestore Database
   - Create database in production mode (or test mode for development)
   - The security rules are already configured in `firestore.rules`

3. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Deploy to Firebase Hosting**
   ```bash
   # Deploy Firestore rules first
   firebase deploy --only firestore:rules
   
   # Then deploy hosting
   firebase deploy --only hosting
   
   # Or deploy everything at once
   firebase deploy
   ```
   
   Your app will be available at:
   - Main Experiment: `https://freeriding-a0ae7.web.app`
   - Admin Dashboard: `https://freeriding-a0ae7.web.app/admin`
   
   See `DEPLOY.md` for detailed deployment instructions.

### Local Setup

1. **Clone or Download the Repository**
   ```bash
   git clone https://github.com/aanimesh-mcgill/freeriding.git
   cd freeriding
   ```

2. **Install Firebase CLI (if deploying)**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Deploy to Firebase Hosting**
   ```bash
   # Login to Firebase
   firebase login
   
   # Deploy everything
   firebase deploy
   ```
   
   Your app will be live at `https://freeriding-a0ae7.web.app`
   
   For local testing: Simply open `index.html` in a web browser

### OneDrive Hosting

1. **Upload Files to OneDrive**
   - Upload all files (`index.html`, `admin.html`, `app.js`, `admin.js`, `style.css`) to a OneDrive folder

2. **Create Shareable Link**
   - Right-click the folder in OneDrive
   - Select "Share" → "Anyone with the link can view"
   - Copy the shareable link
   - Participants can access the experiment via this link

3. **Note**: OneDrive may have limitations with JavaScript execution. For best results, use Firebase Hosting or another web hosting service.

## File Structure

```
freeriding/
├── index.html          # Main experiment interface
├── admin.html          # Admin dashboard interface
├── app.js              # Main experiment logic
├── admin.js            # Admin dashboard logic
├── style.css           # Styling for both interfaces
├── firebase.json       # Firebase configuration
├── firestore.rules     # Firestore security rules
└── README.md           # This file
```

## Firestore Collections

The application uses the following Firestore collections:

- **`participants`**: Stores participant information, current round, total contributions, payoffs, and treatment conditions
- **`contributions`**: Stores individual contribution decisions for each round
- **`payoffs`**: Stores calculated payoffs for each participant per round
- **`groups`**: Stores group information and member lists
- **`rounds`**: Stores round completion status and group totals
- **`settings`**: Stores experiment configuration (rounds, duration, group size, etc.)

## Experiment Design

### Game Mechanics
- Each participant receives an **endowment** (default: 20 tokens) per round
- Participants decide how many tokens (0-20) to contribute to a group project
- Tokens kept remain with the participant
- Contributed tokens are multiplied by a **multiplier** (default: 1.6) and shared equally among all group members
- **Payoff Formula**: `Payoff = (Endowment - Contribution) + (Group Total × Multiplier) / Group Size`

### Treatment Conditions
Each participant is randomly assigned:
- **Team Leaderboard**: Shows rankings of groups by total contributions
- **Individual Leaderboard**: Shows rankings of individual participants by total contributions
- **Contribution Comparison**: Shows whether participant's contribution is higher, similar, or lower than team average

### Round Flow
1. Participant enters Participant ID
2. System assigns participant to a group (or creates new group)
3. Treatment conditions are randomized and assigned
4. For each round:
   - Participant sees round number and timer
   - Participant makes contribution decision
   - Timer counts down (default: 120 seconds)
   - If timer expires, contribution auto-submits with current slider value
   - Once all group members submit, payoffs are calculated
   - Results are displayed
   - Participant proceeds to next round
5. After all rounds, final summary is shown

## Admin Dashboard Usage

1. **Access**: Open `admin.html` in a web browser
2. **Monitor**: View real-time statistics and participant data
3. **Configure**: Adjust experiment settings (rounds, duration, group size, etc.)
4. **Export**: Click "Export to Excel" to download all data as CSV
5. **Reset**: Use "Reset Experiment" to clear all data (use with caution!)

## Configuration

### Default Settings
- **Total Rounds**: 10
- **Round Duration**: 120 seconds
- **Group Size**: 4 participants
- **Endowment**: 20 tokens per round
- **Multiplier**: 1.6

These can be changed in the admin dashboard or by modifying the `settings` collection in Firestore.

## GitHub Repository

Repository: https://github.com/aanimesh-mcgill/freeriding

### CI/CD Pipeline (Automatic Deployment)

The repository includes a GitHub Actions workflow that automatically deploys to Firebase when code is pushed to the `main` branch.

#### Setup CI/CD (One-time)

1. **Get Firebase CI Token**
   ```bash
   firebase login:ci
   ```
   Copy the generated token.

2. **Add Token to GitHub Secrets**
   - Go to: https://github.com/aanimesh-mcgill/freeriding/settings/secrets/actions
   - Click **New repository secret**
   - Name: `FIREBASE_TOKEN`
   - Value: Paste the token from step 1
   - Click **Add secret**

3. **Push Code to Trigger First Deployment**
   ```bash
   git push -u origin main
   ```

#### How It Works

- **Automatic**: Every push to `main` branch triggers deployment
- **Manual**: Can also trigger from GitHub Actions tab
- **Deploys**: Both Firestore rules and Firebase Hosting
- **Status**: Check deployment status in GitHub Actions tab

See `.github/workflows/README.md` for detailed instructions.

### Manual Git Operations

If you need to push changes manually:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Security Considerations

### Firestore Rules
The current rules allow open read/write access for the experiment. For production use:
- Implement Firebase Authentication
- Restrict write access to authenticated users
- Add admin role verification for admin dashboard
- Review and tighten security rules based on your requirements

### Data Privacy
- Participant IDs should not contain personally identifiable information
- Consider implementing data anonymization for exported data
- Review data retention policies

## Troubleshooting

### Common Issues

1. **Firebase Connection Errors**
   - Verify Firebase configuration in `app.js` and `admin.js`
   - Check Firestore is enabled in Firebase Console
   - Verify security rules are deployed

2. **Timer Not Working**
   - Check browser console for JavaScript errors
   - Ensure `app.js` is loaded correctly

3. **Leaderboards Not Updating**
   - Check Firestore permissions
   - Verify real-time listeners are active
   - Check browser console for errors

4. **Export Not Working**
   - Check browser console for errors
   - Ensure all data collections are accessible
   - Try refreshing the admin dashboard

## Future Enhancements

Potential features to add:
- Firebase Authentication for secure access
- Payment integration for real monetary incentives
- Advanced analytics and visualization
- Mobile-responsive design improvements
- Multi-language support
- Email notifications for round completion
- Advanced group formation algorithms

## References

Based on the experimental design from:
- "Individual Behaviour in a Free Riding Experiment" by Joachim Weimann
- Standard public goods game experimental design

## License

This project is for research purposes. Please ensure compliance with your institution's research ethics guidelines.

## Support

For issues or questions:
- Check the GitHub repository issues
- Review Firebase documentation
- Contact the research team

---

**Note**: This application is designed for research purposes. Ensure all necessary ethics approvals are obtained before conducting experiments with human participants.

