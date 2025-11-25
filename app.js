// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSfD_46CbKBi8qX7oly-Lh80ErKE1QYnM",
  authDomain: "freeriding-a0ae7.firebaseapp.com",
  projectId: "freeriding-a0ae7",
  storageBucket: "freeriding-a0ae7.firebasestorage.app",
  messagingSenderId: "722238937738",
  appId: "1:722238937738:web:bec8d087031d67e404ab73",
  measurementId: "G-NNMVM073XB"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Experiment State
let participantId = "";
let uniqueParticipantId = ""; // Auto-generated unique ID
let currentRound = 1;
let totalRounds = 10;
let roundDuration = 120; // seconds
let groupSize = 6; // Default: 6 members per group
let totalTeams = 10; // Default: 10 teams total
let endowment = 20;
let multiplier = 1.6;
let resultsDelay = 3; // seconds to wait before showing results
let groupId = "";
let contribution = 0;
let submitted = false;
let timerInterval = null;
let timeRemaining = 0;
let cumulativePayoff = 0;

// Experiment Design: 7×2 between-subject (14 cells) + 3 within-subject factors
// Between-subject factors:
// 1. Info about contribution (7 levels)
// 2. Focal user contribution level (2 levels: 85% lower or 85% higher than average)
// Within-subject factors (randomized order):
// 1. Team contribution (high: top 25%, low: bottom 25%)
// 2. Individual leaderboard stability (high: 85% maintain ranks, low: 25% maintain ranks)
// 3. Team leaderboard stability (high: 85% maintain ranks, low: 25% maintain ranks)

// Experiment Configuration
let experimentConfig = {
  // Between-subject: Info about contribution (7 levels)
  infoType: 'noInfo', // 'noInfo', 'teamLB', 'indLBWithin', 'bothLBWithin', 'bothLBAcross', 'socialNorm', 'indLBAcross'
  
  // Between-subject: Focal user contribution level (2 levels)
  focalUserContributionLevel: 'lower', // 'lower' (85% rounds lower than average) or 'higher' (85% rounds higher)
  
  // Within-subject: Team contribution (2 levels) - set per round from sequence
  teamContribution: 'high', // 'high' (top 25%) or 'low' (bottom 25%)
  
  // Within-subject: Individual leaderboard stability (2 levels) - set per round from sequence
  individualLBStability: 'high', // 'high' (85% maintain ranks) or 'low' (25% maintain ranks)
  
  // Within-subject: Team leaderboard stability (2 levels) - set per round from sequence
  teamLBStability: 'high', // 'high' (85% maintain ranks) or 'low' (25% maintain ranks)
  
  // Cell assignment
  betweenSubjectCell: null, // 1-14
  withinSubjectSequence: [], // Randomized sequence of within-subject factor combinations per round
  
  // Testing Feature
  showCellDisplay: true, // Show cell assignment (admin-configurable)
  
  // Simulated Team Members
  simulatedTeamSize: 5, // Number of simulated team members (total group size = 6)
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadExperimentSettings();
});

function proceedToWelcome() {
  document.getElementById('consentScreen').classList.remove('active');
  document.getElementById('welcomeScreen').classList.add('active');
}

function initializeEventListeners() {
  // Consent checkbox and button
  const consentCheckbox = document.getElementById('consentCheckbox');
  const consentBtn = document.getElementById('consentBtn');
  if (consentCheckbox && consentBtn) {
    consentCheckbox.addEventListener('change', (e) => {
      consentBtn.disabled = !e.target.checked;
    });
    consentBtn.addEventListener('click', proceedToWelcome);
  }
  
  // Start button
  document.getElementById('startBtn').addEventListener('click', startExperiment);
  
  // Contribution slider
  const slider = document.getElementById('contributionSlider');
  slider.addEventListener('input', updateContribution);
  
  // Quick contribution buttons
  document.querySelectorAll('.btn-contribute').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const value = parseInt(e.target.dataset.value);
      slider.value = value;
      updateContribution();
    });
  });
  
  // Submit button
  document.getElementById('submitBtn').addEventListener('click', submitContribution);
  
  // Next round button
  document.getElementById('nextRoundBtn').addEventListener('click', proceedToNextRound);
  
  // Enter key on participant ID input
  document.getElementById('participantId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      startExperiment();
    }
  });
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });
  
  // Load leaderboard if switching to leaderboard tab
  if (tabName === 'leaderboard') {
    loadLeaderboards();
  }
}

async function loadExperimentSettings() {
  try {
    const settingsDoc = await db.collection('settings').doc('experiment').get();
    const settings = settingsDoc.data();
    if (settings) {
      totalRounds = settings.totalRounds || 10;
      roundDuration = settings.roundDuration || 120;
      groupSize = settings.groupSize || 6;
      totalTeams = settings.totalTeams || 10;
      endowment = settings.endowment || 20;
      multiplier = settings.multiplier || 1.6;
      resultsDelay = settings.resultsDelay || 3;
      
      // Load experiment configuration
      experimentConfig.infoDisplayTiming = settings.infoDisplayTiming || 'eachRound';
      experimentConfig.focalUserCondition = settings.focalUserCondition || 'random';
      experimentConfig.leaderboardStability = settings.leaderboardStability || 'stable';
      experimentConfig.socialNormDisplay = settings.socialNormDisplay || 'none';
      experimentConfig.showTeamLeaderboard = settings.showTeamLeaderboard || false;
      experimentConfig.showIndividualLeaderboardWithinTeam = settings.showIndividualLeaderboardWithinTeam || false;
      experimentConfig.showIndividualLeaderboardAcrossTeams = settings.showIndividualLeaderboardAcrossTeams || false;
      experimentConfig.focalMemberTeamRank = settings.focalMemberTeamRank || 'middle';
      experimentConfig.teamLeaderboardRankingStability = settings.teamLeaderboardRankingStability || 'stable';
      experimentConfig.showTreatmentConditionsIcon = settings.showTreatmentConditionsIcon !== undefined ? settings.showTreatmentConditionsIcon : true;
      experimentConfig.simulatedTeamSize = groupSize - 1; // Total group size minus the focal user
      
      document.getElementById('totalRounds').textContent = totalRounds;
    }
  } catch (error) {
    console.log('Using default settings:', error);
  }
}

// Update unique ID display
function updateUniqueIdDisplay() {
  const uniqueIdEl = document.getElementById('uniqueParticipantId');
  if (uniqueIdEl && uniqueParticipantId) {
    uniqueIdEl.textContent = uniqueParticipantId;
  }
}

// Update treatment conditions icon visibility and content
function updateTreatmentConditionsIcon() {
  const iconEl = document.getElementById('treatmentConditionsIcon');
  const listEl = document.getElementById('treatmentConditionsList');
  
  if (iconEl) {
    iconEl.style.display = experimentConfig.showCellDisplay ? 'inline-block' : 'none';
  }
  
  if (listEl && experimentConfig) {
    const infoTypeLabels = {
      'noInfo': 'No Info',
      'teamLB': 'Team Leaderboard Only',
      'indLBWithin': 'Individual LB (Within Team) Only',
      'bothLBWithin': 'Both Team & Ind LB (Within Team)',
      'bothLBAcross': 'Both Team & Ind LB (Across Teams)',
      'socialNorm': 'Social Norm (Avg Team & Own)',
      'indLBAcross': 'Individual LB (Across Teams) Only'
    };
    
    const conditions = [
      `<strong>Between-Subject Cell: ${experimentConfig.betweenSubjectCell || 'N/A'}</strong>`,
      `Info Type: ${infoTypeLabels[experimentConfig.infoType] || experimentConfig.infoType || 'N/A'}`,
      `Focal User Level: ${experimentConfig.focalUserContributionLevel === 'lower' ? '85% Lower' : '85% Higher'}`,
      `<strong>Round ${currentRound} Within-Subject:</strong>`,
      `Team Contribution: ${experimentConfig.teamContribution === 'high' ? 'High (Top 25%)' : 'Low (Bottom 25%)'}`,
      `Ind LB Stability: ${experimentConfig.individualLBStability === 'high' ? 'High (85%)' : 'Low (25%)'}`,
      `Team LB Stability: ${experimentConfig.teamLBStability === 'high' ? 'High (85%)' : 'Low (25%)'}`
    ];
    
    listEl.innerHTML = conditions.map(c => `<li>${c}</li>`).join('');
  }
}

// Update cell display
function updateCellDisplay() {
  const cellDisplayEl = document.getElementById('cellDisplay');
  if (cellDisplayEl && experimentConfig.betweenSubjectCell) {
    const infoTypeLabels = {
      'noInfo': 'No Info',
      'teamLB': 'Team LB',
      'indLBWithin': 'Ind LB (Team)',
      'bothLBWithin': 'Both (Team)',
      'bothLBAcross': 'Both (All)',
      'socialNorm': 'Social Norm',
      'indLBAcross': 'Ind LB (All)'
    };
    
    const focalLabel = experimentConfig.focalUserContributionLevel === 'lower' ? '85% Lower' : '85% Higher';
    const teamContrib = experimentConfig.teamContribution === 'high' ? 'High' : 'Low';
    const indStab = experimentConfig.individualLBStability === 'high' ? 'H' : 'L';
    const teamStab = experimentConfig.teamLBStability === 'high' ? 'H' : 'L';
    
    cellDisplayEl.innerHTML = `
      <strong>Cell ${experimentConfig.betweenSubjectCell}</strong>: ${infoTypeLabels[experimentConfig.infoType]} | ${focalLabel}<br>
      Round ${currentRound}: Team ${teamContrib} | Ind ${indStab} | Team ${teamStab}
    `;
    cellDisplayEl.style.display = experimentConfig.showCellDisplay ? 'block' : 'none';
  }
}

// Update info display based on infoType
function updateInfoDisplay() {
  // Hide all info panels initially
  const teamLBPanel = document.getElementById('teamLeaderboardPanel');
  const indLBPanel = document.getElementById('individualLeaderboardPanel');
  const socialNormPanel = document.getElementById('socialNormPanel');
  
  if (teamLBPanel) teamLBPanel.classList.add('hidden');
  if (indLBPanel) indLBPanel.classList.add('hidden');
  if (socialNormPanel) socialNormPanel.classList.add('hidden');
  
  // Show info based on infoType
  switch (experimentConfig.infoType) {
    case 'noInfo':
      // No info shown
      break;
    case 'teamLB':
      // Only team leaderboard - shown in tab only, not in treatment panel
      break;
    case 'indLBWithin':
      // Only individual leaderboard within team - shown in tab only
      break;
    case 'bothLBWithin':
      // Both team and individual leaderboard (within team) - shown in tab only
      break;
    case 'bothLBAcross':
      // Both team and individual leaderboard (across teams) - shown in tab only
      break;
    case 'socialNorm':
      // Social norm (average team and own)
      if (socialNormPanel) {
        showSocialNorm();
        socialNormPanel.classList.remove('hidden');
      }
      break;
    case 'indLBAcross':
      // Only individual leaderboard across teams - shown in tab only
      break;
  }
}

// Generate unique participant ID
function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UID-${timestamp}-${random}`;
}

// Define all 14 between-subject cells (7 info types × 2 focal user contribution levels)
const BETWEEN_SUBJECT_CELLS = [
  // Cell 1-7: Focal user 85% rounds LOWER than average
  { infoType: 'noInfo', focalUserContributionLevel: 'lower' }, // Cell 1
  { infoType: 'teamLB', focalUserContributionLevel: 'lower' }, // Cell 2
  { infoType: 'indLBWithin', focalUserContributionLevel: 'lower' }, // Cell 3
  { infoType: 'bothLBWithin', focalUserContributionLevel: 'lower' }, // Cell 4
  { infoType: 'bothLBAcross', focalUserContributionLevel: 'lower' }, // Cell 5
  { infoType: 'socialNorm', focalUserContributionLevel: 'lower' }, // Cell 6
  { infoType: 'indLBAcross', focalUserContributionLevel: 'lower' }, // Cell 7
  
  // Cell 8-14: Focal user 85% rounds HIGHER than average
  { infoType: 'noInfo', focalUserContributionLevel: 'higher' }, // Cell 8
  { infoType: 'teamLB', focalUserContributionLevel: 'higher' }, // Cell 9
  { infoType: 'indLBWithin', focalUserContributionLevel: 'higher' }, // Cell 10
  { infoType: 'bothLBWithin', focalUserContributionLevel: 'higher' }, // Cell 11
  { infoType: 'bothLBAcross', focalUserContributionLevel: 'higher' }, // Cell 12
  { infoType: 'socialNorm', focalUserContributionLevel: 'higher' }, // Cell 13
  { infoType: 'indLBAcross', focalUserContributionLevel: 'higher' }, // Cell 14
];

// Generate all possible within-subject factor combinations (2×2×2 = 8 combinations)
function generateWithinSubjectCombinations() {
  const combinations = [];
  const teamContribs = ['high', 'low'];
  const indStabilities = ['high', 'low'];
  const teamStabilities = ['high', 'low'];
  
  for (const teamContrib of teamContribs) {
    for (const indStab of indStabilities) {
      for (const teamStab of teamStabilities) {
        combinations.push({
          teamContribution: teamContrib,
          individualLBStability: indStab,
          teamLBStability: teamStab
        });
      }
    }
  }
  return combinations;
}

// Randomly assign participant to one of 14 between-subject cells
// If URL parameter 'cell' is provided, use that cell for testing
function assignBetweenSubjectCell() {
  // Check for URL parameter for testing
  const urlParams = new URLSearchParams(window.location.search);
  const cellParam = urlParams.get('cell');
  
  let cellIndex;
  if (cellParam) {
    // Use specified cell (1-14) for testing
    const requestedCell = parseInt(cellParam);
    if (requestedCell >= 1 && requestedCell <= BETWEEN_SUBJECT_CELLS.length) {
      cellIndex = requestedCell - 1; // Convert to 0-based index
      console.log(`[TESTING] Using cell ${requestedCell} from URL parameter`);
    } else {
      console.warn(`[TESTING] Invalid cell parameter: ${cellParam}. Using random assignment.`);
      cellIndex = Math.floor(Math.random() * BETWEEN_SUBJECT_CELLS.length);
    }
  } else {
    // Random assignment
    cellIndex = Math.floor(Math.random() * BETWEEN_SUBJECT_CELLS.length);
  }
  
  const cell = BETWEEN_SUBJECT_CELLS[cellIndex];
  return {
    cellNumber: cellIndex + 1,
    ...cell
  };
}

// Generate randomized sequence of within-subject factor combinations for all rounds
function generateWithinSubjectSequence(totalRounds) {
  const allCombinations = generateWithinSubjectCombinations();
  const sequence = [];
  
  // For totalRounds, we need to distribute 8 combinations
  // Some combinations will appear more than once
  for (let i = 0; i < totalRounds; i++) {
    // Randomly select a combination
    const randomIndex = Math.floor(Math.random() * allCombinations.length);
    sequence.push({ ...allCombinations[randomIndex] });
  }
  
  // Shuffle the sequence to randomize order
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  
  return sequence;
}

async function startExperiment() {
  participantId = document.getElementById('participantId').value.trim();
  
  if (!participantId) {
    alert('Please enter a valid Participant ID.');
    return;
  }
  
  showLoading(true);
  
  try {
    // Check if participant already exists
    const participantDoc = await db.collection('participants').doc(participantId).get();
    const data = participantDoc.data();
    
    // Check for URL parameter for testing (works for both new and existing participants)
    const urlParams = new URLSearchParams(window.location.search);
    const cellParam = urlParams.get('cell');
    let shouldUseUrlCell = false;
    
    if (cellParam) {
      const requestedCell = parseInt(cellParam);
      if (requestedCell >= 1 && requestedCell <= BETWEEN_SUBJECT_CELLS.length) {
        shouldUseUrlCell = true;
        console.log(`[TESTING] URL parameter cell=${requestedCell} detected`);
      }
    }
    
    if (data) {
      currentRound = data.currentRound || 1;
      groupId = data.groupId || '';
      cumulativePayoff = data.cumulativePayoff || 0;
      uniqueParticipantId = data.uniqueParticipantId || generateUniqueId();
      
      // If URL parameter is provided, override the cell assignment for testing
      if (shouldUseUrlCell) {
        console.log(`[TESTING] Overriding existing cell assignment with URL parameter cell=${cellParam}`);
        const cellAssignment = assignBetweenSubjectCell();
        experimentConfig.betweenSubjectCell = cellAssignment.cellNumber;
        experimentConfig.infoType = cellAssignment.infoType;
        experimentConfig.focalUserContributionLevel = cellAssignment.focalUserContributionLevel;
        
        // Update participant record with new cell assignment
        await db.collection('participants').doc(participantId).update({
          'experimentConfig.betweenSubjectCell': cellAssignment.cellNumber,
          'experimentConfig.infoType': cellAssignment.infoType,
          'experimentConfig.focalUserContributionLevel': cellAssignment.focalUserContributionLevel
        });
      } else {
        // Load experiment config from participant record
        if (data.experimentConfig) {
          experimentConfig = { ...experimentConfig, ...data.experimentConfig };
        }
      }
      
      if (currentRound > totalRounds) {
        showEndScreen();
        return;
      }
    } else {
      // New participant - generate unique ID
      uniqueParticipantId = generateUniqueId();
      
      // Randomly assign to one of 14 between-subject cells
      const cellAssignment = assignBetweenSubjectCell();
      experimentConfig.betweenSubjectCell = cellAssignment.cellNumber;
      experimentConfig.infoType = cellAssignment.infoType;
      experimentConfig.focalUserContributionLevel = cellAssignment.focalUserContributionLevel;
      
      // Generate randomized sequence of within-subject factor combinations
      experimentConfig.withinSubjectSequence = generateWithinSubjectSequence(totalRounds);
      
      // Assign to group (same group for all rounds)
      groupId = await assignToGroup(participantId);
      
      // Generate simulated team member contributions for all rounds
      await generateSimulatedTeamContributions(groupId);
      
      // Create participant record with experiment config
      await db.collection('participants').doc(participantId).set({
        participantId,
        uniqueParticipantId,
        groupId,
        currentRound: 1,
        totalContribution: 0,
        cumulativePayoff: 0,
        experimentConfig: experimentConfig,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      });
      
      // Track cell assignment for balance
      await db.collection('cellAssignments').add({
        participantId,
        uniqueParticipantId,
        betweenSubjectCell: cellAssignment.cellNumber,
        infoType: cellAssignment.infoType,
        focalUserContributionLevel: cellAssignment.focalUserContributionLevel,
        assignedFromURL: cellParam !== null, // Flag if assigned from URL parameter
        urlCellParameter: cellParam || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Show experiment screen
    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('experimentScreen').classList.add('active');
    
    // Update unique ID display
    updateUniqueIdDisplay();
    
    // Update treatment conditions icon visibility and content
    updateTreatmentConditionsIcon();
    
    // Hide/show leaderboard tab based on infoType
    const leaderboardTabBtn = document.querySelector('.tab-btn[data-tab="leaderboard"]');
    if (leaderboardTabBtn) {
      if (experimentConfig.infoType === 'noInfo') {
        leaderboardTabBtn.style.display = 'none';
      } else {
        leaderboardTabBtn.style.display = 'block';
      }
    }
    
    // Set up real-time leaderboard listeners
    setupLeaderboardListeners();
    
    // Load current round
    await loadRound();
    
  } catch (error) {
    console.error('Error starting experiment:', error);
    alert('Error starting experiment. Please try again.');
  } finally {
    showLoading(false);
  }
}

async function assignToGroup(pid) {
  // Find existing groups that need members
  const groupsSnapshot = await db.collection('groups')
    .where('memberCount', '<', groupSize)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  
  let groupId;
  
  if (!groupsSnapshot.empty) {
    // Join existing group
    const groupDoc = groupsSnapshot.docs[0];
    groupId = groupDoc.id;
    await groupDoc.ref.update({
      members: firebase.firestore.FieldValue.arrayUnion(pid),
      memberCount: firebase.firestore.FieldValue.increment(1)
    });
  } else {
    // Create new group
    const newGroupRef = db.collection('groups').doc();
    groupId = newGroupRef.id;
    await newGroupRef.set({
      groupId,
      members: [pid],
      memberCount: 1,
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  
  return groupId;
}

// Generate simulated team member contributions for all rounds
async function generateSimulatedTeamContributions(groupId) {
  const simulatedMembers = [];
  const numSimulated = experimentConfig.simulatedTeamSize;
  
  // Create simulated member IDs
  for (let i = 1; i <= numSimulated; i++) {
    simulatedMembers.push(`SIM_${groupId}_${i}`);
  }
  
  // Generate contributions for each round based on condition
  for (let round = 1; round <= totalRounds; round++) {
    const contributions = [];
    
    // Base contribution levels for simulated members (they contribute moderately)
    // Individual LB stability affects how ranks are maintained across rounds
    const baseContributions = [];
    for (let i = 0; i < numSimulated; i++) {
      // Simulated members contribute between 8-15 tokens on average
      let contribution;
      
      // Get the within-subject factor for this round
      let individualStability = 'high'; // default
      if (experimentConfig.withinSubjectSequence && experimentConfig.withinSubjectSequence.length >= round) {
        individualStability = experimentConfig.withinSubjectSequence[round - 1].individualLBStability;
      }
      
      // High stability (50% maintain ranks): maintain relative positions
      // Low stability (50% maintain ranks): allow more variation
      const shouldMaintainRank = individualStability === 'high'
        ? (round <= Math.floor(totalRounds * 0.5))
        : (round <= Math.floor(totalRounds * 0.5));
      
      if (shouldMaintainRank && round > 1) {
        // Maintain relative rank positions (high contributors stay high, low stay low)
        const rank = i / (numSimulated - 1); // 0 to 1
        contribution = Math.round(7 + rank * 8); // 7 to 15
      } else {
        // Allow more variation in contributions
        contribution = Math.round(8 + Math.random() * 7); // 8 to 15
      }
      baseContributions.push(contribution);
    }
    
    // Adjust based on focal user condition (will be set when focal user submits)
    // For now, just store base contributions
    for (let i = 0; i < numSimulated; i++) {
      contributions.push({
        memberId: simulatedMembers[i],
        contribution: baseContributions[i],
        round: round
      });
    }
    
    // Store simulated contributions (will be adjusted when focal user submits)
    await db.collection('simulatedContributions').doc(`${groupId}_${round}`).set({
      groupId,
      round,
      contributions: contributions,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Store simulated members in group
  await db.collection('groups').doc(groupId).update({
    simulatedMembers: simulatedMembers
  });
}

// Get simulated team contributions for current round, adjusted based on focal user's contribution
async function getSimulatedTeamContributions(focalUserContribution) {
  const simDoc = await db.collection('simulatedContributions').doc(`${groupId}_${currentRound}`).get();
  if (!simDoc.data()) return [];
  
  const contributions = simDoc.data().contributions || [];
  const adjustedContributions = [];
  
  // Calculate average of simulated members
  const simAvg = contributions.reduce((sum, c) => sum + c.contribution, 0) / contributions.length;
  
  // Adjust based on focal user contribution level (85% rounds lower or higher than average)
  // Track which rounds should be lower/higher to ensure 85% compliance
  const roundsSoFar = currentRound;
  const totalRoundsForCondition = totalRounds;
  const targetLowerRounds = Math.floor(totalRoundsForCondition * 0.85);
  const roundsLower = Math.floor((roundsSoFar / totalRoundsForCondition) * targetLowerRounds);
  const shouldBeLower = roundsLower < targetLowerRounds;
  
  let adjustment;
  if (experimentConfig.focalUserContributionLevel === 'lower') {
    // 85% rounds: focal user lower than average
    if (shouldBeLower || Math.random() < 0.85) {
      // Make simulated members contribute more so focal user is lower
      const targetAvg = focalUserContribution + (endowment * 0.3); // Simulated members contribute 30% more
      adjustment = targetAvg - simAvg;
    } else {
      // 15% rounds: can be similar or higher (for variety)
      adjustment = (focalUserContribution - simAvg) * 0.5;
    }
  } else {
    // 85% rounds: focal user higher than average
    if (!shouldBeLower || Math.random() < 0.85) {
      // Make simulated members contribute less so focal user is higher
      const targetAvg = Math.max(0, focalUserContribution - (endowment * 0.3)); // Simulated members contribute 30% less
      adjustment = targetAvg - simAvg;
    } else {
      // 15% rounds: can be similar or lower (for variety)
      adjustment = (focalUserContribution - simAvg) * 0.5;
    }
  }
  
  contributions.forEach(c => {
    adjustedContributions.push({
      ...c,
      contribution: Math.max(0, Math.min(endowment, Math.round(c.contribution + adjustment)))
    });
  });
  
  return adjustedContributions;
}

async function loadRound() {
  currentRound = parseInt(await getCurrentRound());
  
  if (currentRound > totalRounds) {
    showEndScreen();
    return;
  }
  
  // Set within-subject factors for this round from the randomized sequence
  if (experimentConfig.withinSubjectSequence && experimentConfig.withinSubjectSequence.length >= currentRound) {
    const roundFactors = experimentConfig.withinSubjectSequence[currentRound - 1];
    experimentConfig.teamContribution = roundFactors.teamContribution;
    experimentConfig.individualLBStability = roundFactors.individualLBStability;
    experimentConfig.teamLBStability = roundFactors.teamLBStability;
  }
  
  // Update cell display
  updateCellDisplay();
  
  // Reset UI
  document.getElementById('currentRound').textContent = currentRound;
  document.getElementById('remainingTokens').textContent = endowment;
  document.getElementById('contributionSlider').value = 0;
  document.getElementById('contributionAmount').textContent = 0;
  document.getElementById('keptAmount').textContent = endowment;
  document.getElementById('sliderValue').textContent = 0;
  document.getElementById('submitBtn').disabled = false;
  document.getElementById('submittedMessage').classList.add('hidden');
  document.getElementById('roundResults').classList.add('hidden');
  document.getElementById('nextRoundBtn').classList.add('hidden');
  document.getElementById('waitingForResults').classList.add('hidden');
  
  // Show decision section and switch to decision tab
  const decisionSection = document.getElementById('decision-section');
  if (decisionSection) {
    decisionSection.style.display = 'block';
  }
  switchTab('decision');
  
  // Clear leaderboard content when starting a new round (before submission)
  const leaderboardContent = document.getElementById('leaderboardContent');
  if (leaderboardContent && experimentConfig.infoType !== 'noInfo') {
    if (experimentConfig.infoType === 'socialNorm') {
      leaderboardContent.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Information will be available after the round is complete.</p>';
    } else {
      leaderboardContent.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Leaderboard will be available after the round is complete.</p>';
    }
  }
  
  submitted = false;
  contribution = 0;
  
  // Reset slider and buttons - do not preselect any button
  document.getElementById('contributionSlider').value = 0;
  document.querySelectorAll('.btn-contribute').forEach(btn => {
    btn.classList.remove('active');
  });
  updateContribution();
  
  // Check if already submitted for this round
  const existingContribution = await db.collection('contributions')
    .where('participantId', '==', participantId)
    .where('round', '==', currentRound)
    .limit(1)
    .get();
  
  if (!existingContribution.empty) {
    const data = existingContribution.docs[0].data();
    contribution = data.contribution;
    submitted = true;
    document.getElementById('contributionSlider').value = contribution;
    document.getElementById('contributionAmount').textContent = contribution;
    document.getElementById('keptAmount').textContent = endowment - contribution;
    document.getElementById('sliderValue').textContent = contribution;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submittedMessage').classList.remove('hidden');
    
    // Check if round is complete
    await checkRoundCompletion();
  } else {
    // Start timer
    startTimer();
  }
  
  // Update info display based on infoType
  updateInfoDisplay();
}

async function getCurrentRound() {
  const participantDoc = await db.collection('participants').doc(participantId).get();
  const data = participantDoc.data();
  return data ? data.currentRound : 1;
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timeRemaining = roundDuration;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      if (!submitted) {
        autoSubmit();
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerEl = document.getElementById('timer');
  timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Add warning classes
  timerEl.classList.remove('warning', 'danger');
  if (timeRemaining <= 30) {
    timerEl.classList.add('danger');
  } else if (timeRemaining <= 60) {
    timerEl.classList.add('warning');
  }
}

function updateContribution() {
  contribution = parseInt(document.getElementById('contributionSlider').value);
  const kept = endowment - contribution;
  
  document.getElementById('contributionAmount').textContent = contribution;
  document.getElementById('keptAmount').textContent = kept;
  document.getElementById('sliderValue').textContent = contribution;
  
  // Update active button
  document.querySelectorAll('.btn-contribute').forEach(btn => {
    if (parseInt(btn.dataset.value) === contribution) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  document.getElementById('submitBtn').disabled = false;
}

async function submitContribution() {
  if (submitted) return;
  
  contribution = parseInt(document.getElementById('contributionSlider').value);
  
  if (isNaN(contribution) || contribution < 0 || contribution > endowment) {
    alert(`Please choose a contribution between 0 and ${endowment}.`);
    return;
  }
  
  // Show confirmation dialog
  const confirmed = confirm(
    `Confirm your contribution:\n\n` +
    `You will contribute: ${contribution} tokens\n` +
    `You will keep: ${endowment - contribution} tokens\n\n` +
    `Click OK to confirm, or Cancel to change your contribution.`
  );
  
  if (!confirmed) {
    return; // User cancelled, allow them to change contribution
  }
  
  showLoading(true);
  
  try {
    // Save contribution with all treatment information
    await db.collection('contributions').add({
      participantId,
      groupId,
      round: currentRound,
      contribution,
      endowment,
      // Treatment information (new structure)
      treatmentConditions: {
        betweenSubjectCell: experimentConfig.betweenSubjectCell,
        infoType: experimentConfig.infoType,
        focalUserContributionLevel: experimentConfig.focalUserContributionLevel,
        teamContribution: experimentConfig.teamContribution,
        individualLBStability: experimentConfig.individualLBStability,
        teamLBStability: experimentConfig.teamLBStability,
        round: currentRound
      },
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      submittedAt: Date.now()
    });
    
    // Update participant stats
    await db.collection('participants').doc(participantId).update({
      totalContribution: firebase.firestore.FieldValue.increment(contribution),
      lastActivity: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    submitted = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submittedMessage').classList.remove('hidden');
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Get simulated team contributions and complete round immediately
    await completeRoundWithSimulatedMembers();
    
  } catch (error) {
    console.error('Error submitting contribution:', error);
    alert('Error submitting contribution. Please try again.');
  } finally {
    showLoading(false);
  }
}

async function autoSubmit() {
  if (submitted) return;
  
  // Auto-submit with current slider value (or 0 if not set)
  contribution = parseInt(document.getElementById('contributionSlider').value) || 0;
  await submitContribution();
}

// Complete round immediately with simulated team members
async function completeRoundWithSimulatedMembers() {
  // Get simulated team contributions adjusted to focal user's contribution
  const simulatedContributions = await getSimulatedTeamContributions(contribution);
  
  // Save simulated contributions to Firestore
  for (const simContrib of simulatedContributions) {
    await db.collection('contributions').add({
      participantId: simContrib.memberId,
      groupId,
      round: currentRound,
      contribution: simContrib.contribution,
      endowment,
      isSimulated: true,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      submittedAt: Date.now()
    });
  }
  
  // Calculate payoffs immediately
  await calculateRoundPayoffs();
  
  // Show results (delay is handled inside showRoundResults)
  await showRoundResults();
}

async function checkRoundCompletion() {
  // This function is kept for backward compatibility but not used with simulated members
  // With simulated members, we complete immediately in completeRoundWithSimulatedMembers
  await completeRoundWithSimulatedMembers();
}

async function calculateRoundPayoffs() {
  // Get all contributions for this round in this group
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .where('round', '==', currentRound)
    .get();
  
  let groupTotal = 0;
  const contributions = {};
  
  contributionsSnapshot.forEach(doc => {
    const data = doc.data();
    groupTotal += data.contribution;
    contributions[data.participantId] = data.contribution;
  });
  
  const groupShare = (groupTotal * multiplier) / groupSize;
  
  // Calculate and save payoffs for each participant
  const batch = db.batch();
  
  for (const [pid, contrib] of Object.entries(contributions)) {
    const kept = endowment - contrib;
    const payoff = kept + groupShare;
    
    // Save payoff with all treatment information
    const payoffRef = db.collection('payoffs').doc();
    batch.set(payoffRef, {
      participantId: pid,
      groupId,
      round: currentRound,
      contribution: contrib,
      groupTotal,
      groupShare,
      kept,
      payoff,
      // Treatment information (only for real participants, not simulated)
      treatmentConditions: pid.startsWith('SIM_') ? null : {
        betweenSubjectCell: experimentConfig.betweenSubjectCell,
        infoType: experimentConfig.infoType,
        focalUserContributionLevel: experimentConfig.focalUserContributionLevel,
        teamContribution: experimentConfig.teamContribution,
        individualLBStability: experimentConfig.individualLBStability,
        teamLBStability: experimentConfig.teamLBStability,
        round: currentRound
      },
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update participant cumulative payoff (only for real participants, not simulated)
    if (!pid.startsWith('SIM_')) {
      const participantRef = db.collection('participants').doc(pid);
      batch.update(participantRef, {
        cumulativePayoff: firebase.firestore.FieldValue.increment(payoff),
        lastActivity: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  
  await batch.commit();
  
  // Store comprehensive round data including all simulated contributions, ranks, team totals, and team ranks
  const roundData = {
    groupId,
    round: currentRound,
    groupTotal,
    groupShare,
    completed: true,
    completedAt: firebase.firestore.FieldValue.serverTimestamp(),
    
    // Individual contributions and ranks within team
    teamMembers: [],
    
    // Team totals and ranks
    teamTotals: [],
    teamRanks: []
  };
  
  // Get all team member contributions and calculate ranks
  const teamContributions = [];
  contributionsSnapshot.forEach(doc => {
    const data = doc.data();
    teamContributions.push({
      participantId: data.participantId,
      contribution: data.contribution,
      isSimulated: data.isSimulated || false
    });
  });
  
  // Sort by contribution to get ranks
  teamContributions.sort((a, b) => b.contribution - a.contribution);
  teamContributions.forEach((member, index) => {
    roundData.teamMembers.push({
      participantId: member.participantId,
      contribution: member.contribution,
      rank: index + 1,
      isSimulated: member.isSimulated
    });
  });
  
  // Get all teams and their totals for this round
  const groupsSnapshot = await db.collection('groups').get();
  const teamTotalsMap = {};
  
  for (const groupDoc of groupsSnapshot.docs) {
    const gid = groupDoc.id;
    const teamContribsSnapshot = await db.collection('contributions')
      .where('groupId', '==', gid)
      .where('round', '==', currentRound)
      .get();
    
    let teamTotal = 0;
    teamContribsSnapshot.forEach(doc => {
      teamTotal += doc.data().contribution;
    });
    
    teamTotalsMap[gid] = teamTotal;
  }
  
  // Sort teams by total to get ranks
  const sortedTeams = Object.entries(teamTotalsMap)
    .sort((a, b) => b[1] - a[1]);
  
  sortedTeams.forEach(([gid, total], index) => {
    roundData.teamTotals.push({
      groupId: gid,
      total: total,
      rank: index + 1,
      isFocalTeam: gid === groupId
    });
  });
  
  // Update round status with comprehensive data
  await db.collection('rounds').doc(`${groupId}_${currentRound}`).set(roundData, { merge: true });
}

async function showRoundResults() {
  // Get payoff for this participant
  const payoffSnapshot = await db.collection('payoffs')
    .where('participantId', '==', participantId)
    .where('round', '==', currentRound)
    .limit(1)
    .get();
  
  if (payoffSnapshot.empty) return;
  
  const payoffData = payoffSnapshot.docs[0].data();
  
  // Get group total
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .where('round', '==', currentRound)
    .get();
  
  let groupTotal = 0;
  contributionsSnapshot.forEach(doc => {
    groupTotal += doc.data().contribution;
  });
  
  // Update participant cumulative payoff
  const participantDoc = await db.collection('participants').doc(participantId).get();
  const participantData = participantDoc.data();
  cumulativePayoff = participantData ? participantData.cumulativePayoff || 0 : 0;
  
  // Hide decision section immediately (will be shown again in next round)
  const decisionSection = document.getElementById('decision-section');
  if (decisionSection) {
    decisionSection.style.display = 'none';
  }
  
  // Show waiting message with progress bar
  const waitingForResults = document.getElementById('waitingForResults');
  const progressBar = document.getElementById('progressBar');
  if (waitingForResults && progressBar) {
    waitingForResults.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    // Update waiting message based on infoType - don't mention leaderboard if not applicable
    const waitingMessage = waitingForResults.querySelector('p');
    if (waitingMessage) {
      if (experimentConfig.infoType === 'noInfo' || experimentConfig.infoType === 'socialNorm') {
        waitingMessage.textContent = 'Calculating results...';
      } else {
        waitingMessage.textContent = 'Calculating results and preparing leaderboards...';
      }
    }
    
    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 2;
      if (progress > 95) {
        progress = 95; // Don't complete until results are ready
      }
      progressBar.style.width = progress + '%';
    }, (resultsDelay * 1000) / 50); // Update 50 times over the delay period
    
    // Wait for configured delay before showing results
    setTimeout(async () => {
      // Complete progress bar
      clearInterval(progressInterval);
      if (progressBar) {
        progressBar.style.width = '100%';
      }
      
      // Hide waiting message
      if (waitingForResults) {
        waitingForResults.classList.add('hidden');
      }
      
      // Display results
      document.getElementById('resultYourContribution').textContent = contribution;
      document.getElementById('resultGroupTotal').textContent = groupTotal;
      document.getElementById('resultYourShare').textContent = payoffData.groupShare.toFixed(2);
      document.getElementById('resultPayoff').textContent = payoffData.payoff.toFixed(2);
      document.getElementById('resultCumulative').textContent = cumulativePayoff.toFixed(2);
      
      // Show leaderboards and social norm based on infoType
      // Load leaderboards after round completes (including Round 1)
      if (experimentConfig.infoType !== 'noInfo') {
        await loadLeaderboards();
        
        // Auto-switch to leaderboard tab if info is shown
        setTimeout(() => {
          switchTab('leaderboard');
        }, 500);
      }
      
      // Show results section and next round button
      const roundResults = document.getElementById('roundResults');
      roundResults.classList.remove('hidden');
      document.getElementById('nextRoundBtn').classList.remove('hidden');
      
      // Scroll to top of results smoothly
      roundResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update contribution comparison if shown (for backward compatibility)
      // This is now handled by social norm display
    }, resultsDelay * 1000);
  } else {
    // Fallback if elements don't exist
    setTimeout(async () => {
      // Display results
      document.getElementById('resultYourContribution').textContent = contribution;
      document.getElementById('resultGroupTotal').textContent = groupTotal;
      document.getElementById('resultYourShare').textContent = payoffData.groupShare.toFixed(2);
      document.getElementById('resultPayoff').textContent = payoffData.payoff.toFixed(2);
      document.getElementById('resultCumulative').textContent = cumulativePayoff.toFixed(2);
      
      // Show results section
      const roundResults = document.getElementById('roundResults');
      roundResults.classList.remove('hidden');
      document.getElementById('nextRoundBtn').classList.remove('hidden');
      
      // Scroll to top of results smoothly
      roundResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Show leaderboards and social norm based on infoType
      // Load leaderboards after round completes (including Round 1)
      if (experimentConfig.infoType !== 'noInfo') {
        await loadLeaderboards();
        
        // Auto-switch to leaderboard tab if info is shown
        setTimeout(() => {
          switchTab('leaderboard');
        }, 500);
      }
    }, resultsDelay * 1000);
  }
}

async function updateContributionComparison() {
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .where('round', '==', currentRound)
    .get();

  let sum = 0;
  let count = 0;

  contributionsSnapshot.forEach(doc => {
    sum += doc.data().contribution;
    count++;
  });

  const teamAvg = count > 0 ? sum / count : 0;
  
  document.getElementById('yourContribution').textContent = contribution;
  document.getElementById('teamAverage').textContent = teamAvg.toFixed(2);
  
  const statusEl = document.getElementById('comparisonStatus');
  const messageEl = document.getElementById('comparisonMessage');
  
  statusEl.classList.remove('higher', 'similar', 'lower');
  
    if (contribution > teamAvg) {
    statusEl.classList.add('higher');
    messageEl.textContent = 'You contributed MORE than the team average';
  } else if (Math.abs(contribution - teamAvg) < 0.5) {
    statusEl.classList.add('similar');
    messageEl.textContent = 'You contributed SIMILAR to the team average';
    } else {
    statusEl.classList.add('lower');
    messageEl.textContent = 'You contributed LESS than the team average';
  }
  
  document.getElementById('contributionComparisonPanel').classList.remove('hidden');
}

async function proceedToNextRound() {
  // Increment round
  currentRound++;
  
  // Update participant
  await db.collection('participants').doc(participantId).update({
    currentRound: currentRound,
    lastActivity: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  if (currentRound > totalRounds) {
    showEndScreen();
  } else {
    await loadRound();
  }
}

async function loadTeamLeaderboard() {
  // Use the same logic as loadTeamLeaderboardForTab but for treatment panel
  const tbody = document.getElementById('teamLeaderboardBody');
  if (!tbody) return;
  
  // Get all groups and their total contributions
  const groupsSnapshot = await db.collection('groups').get();
  const groupTotals = {};
  
  // Calculate focal team's total
  let focalTeamTotal = 0;
  const focalContributions = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .get();
  focalContributions.forEach(doc => {
    focalTeamTotal += doc.data().contribution;
  });
  
  // Get other teams' totals
  for (const groupDoc of groupsSnapshot.docs) {
    const gid = groupDoc.id;
    if (gid === groupId) continue;
    
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', gid)
      .get();
    
    let total = 0;
    contributionsSnapshot.forEach(doc => {
      total += doc.data().contribution;
    });
    
    groupTotals[gid] = total;
  }
  
  // Determine target position for focal team based on teamContribution (high = top 25%, low = bottom 25%)
  const allTeamTotals = Object.values(groupTotals);
  allTeamTotals.push(focalTeamTotal);
  allTeamTotals.sort((a, b) => b - a);
  
  let targetRank;
  const totalTeams = allTeamTotals.length;
  const top25Percent = Math.max(1, Math.floor(totalTeams * 0.25));
  const bottom25Percent = Math.max(1, Math.floor(totalTeams * 0.75));
  
  // Check if team LB stability should maintain ranks (high = 85% maintain, low = 25% maintain)
  const shouldMaintainRank = experimentConfig.teamLBStability === 'high' 
    ? (currentRound <= Math.floor(totalRounds * 0.5))
    : (currentRound <= Math.floor(totalRounds * 0.5));
  
  if (shouldMaintainRank && currentRound > 1) {
    // Maintain previous rank (85% or 25% of rounds depending on stability level)
    if (experimentConfig.teamContribution === 'high') {
      targetRank = top25Percent; // Top 25%
    } else {
      targetRank = bottom25Percent; // Bottom 25%
    }
  } else {
    // Allow rank to change (50% of rounds for both high and low stability)
    if (experimentConfig.teamContribution === 'high') {
      // High condition: target top 25%
      targetRank = Math.floor(Math.random() * top25Percent) + 1;
    } else {
      // Low condition: target bottom 25%
      targetRank = bottom25Percent + Math.floor(Math.random() * (totalTeams - bottom25Percent));
    }
  }
  
  // Create simulated teams to ensure focal team is at target rank
  const minTeamsNeeded = Math.max(10, targetRank + 2);
  const simulatedTeams = [];
  const sortedOtherTeams = Object.entries(groupTotals).sort((a, b) => b[1] - a[1]);
  
  for (let i = 0; i < minTeamsNeeded - 1; i++) {
    let simulatedTotal;
    if (i < targetRank - 1) {
      simulatedTotal = focalTeamTotal + (minTeamsNeeded - i) * 5;
    } else {
      simulatedTotal = Math.max(0, focalTeamTotal - (i - targetRank + 2) * 5);
    }
    
    if (i < sortedOtherTeams.length) {
      groupTotals[sortedOtherTeams[i][0]] = simulatedTotal;
    } else {
      simulatedTeams.push({ id: `SIM_TEAM_${i}`, total: simulatedTotal });
    }
  }
  
  // Combine all teams
  const allTeams = [];
  Object.entries(groupTotals).forEach(([gid, total]) => {
    allTeams.push({ id: gid, total: total, isSimulated: false });
  });
  simulatedTeams.forEach(team => {
    allTeams.push({ id: team.id, total: team.total, isSimulated: true });
  });
  allTeams.push({ id: groupId, total: focalTeamTotal, isSimulated: false, isFocal: true });
  
  // Sort by total
  allTeams.sort((a, b) => b.total - a.total);
  
  // Assign unique team numbers: focal team is always Team 5, others are 1-4, 6-10
  const availableNumbers = [1, 2, 3, 4, 6, 7, 8, 9, 10]; // Skip 5 for focal team
  let numberIndex = 0;
  const teamNumberMap = new Map();
  
  // Always assign Team 5 to focal team
  teamNumberMap.set(groupId, 5);
  
  // Assign numbers 1-4, 6-10 to all other teams
  allTeams.forEach(team => {
    if (team.isFocal) return; // Skip focal team
    
    if (!teamNumberMap.has(team.id) && numberIndex < availableNumbers.length) {
      teamNumberMap.set(team.id, availableNumbers[numberIndex]);
      numberIndex++;
    }
  });
  
  // Display top 10
  tbody.innerHTML = '';
  allTeams.slice(0, 10).forEach((team, index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    let teamName;
    if (team.isFocal) {
      teamName = 'Your Team'; // Display as "Your Team" but internally it's Team 5
    } else {
      const teamNum = teamNumberMap.get(team.id) || availableNumbers[numberIndex % availableNumbers.length];
      teamName = `Team ${teamNum}`;
    }
    row.insertCell(1).textContent = teamName;
    row.insertCell(2).textContent = team.total;
    if (team.isFocal) {
      row.style.backgroundColor = '#e3f2fd';
      row.style.fontWeight = 'bold';
    }
  });
  
  document.getElementById('teamLeaderboardPanel').classList.remove('hidden');
}

async function loadIndividualLeaderboard() {
  // Get all participants and their total contributions
  const participantsSnapshot = await db.collection('participants').get();
  const playerTotals = [];
  
  participantsSnapshot.forEach(doc => {
    const data = doc.data();
    playerTotals.push({
      id: data.participantId,
      total: data.totalContribution || 0
    });
  });
  
  // Sort by total
  playerTotals.sort((a, b) => b.total - a.total);
  
  const tbody = document.getElementById('individualLeaderboardBody');
  tbody.innerHTML = '';
  
  playerTotals.slice(0, 10).forEach((player, index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = player.id;
    row.insertCell(2).textContent = player.total;
  });
  
  document.getElementById('individualLeaderboardPanel').classList.remove('hidden');
}

function updateTreatmentPanels() {
  // This function is now replaced by updateInfoDisplay() which uses infoType
  // Keeping for backward compatibility but it's handled in updateInfoDisplay()
}

// Load all leaderboards for the leaderboard tab
async function loadLeaderboards() {
  const leaderboardContent = document.getElementById('leaderboardContent');
  if (!leaderboardContent) return;
  
  // Load leaderboards - they should be available after round completes
  // Check if we have contribution data for current round to determine if round is complete
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .where('round', '==', currentRound)
    .get();
  
  // If no contributions yet for this round (round not started), show waiting message
  if (contributionsSnapshot.empty) {
    if (experimentConfig.infoType === 'noInfo') {
      leaderboardContent.innerHTML = '';
      return;
    } else if (experimentConfig.infoType === 'socialNorm') {
      leaderboardContent.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Information will be available after the round is complete.</p>';
      return;
    } else {
      leaderboardContent.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Leaderboard will be available after the round is complete.</p>';
      return;
    }
  }
  
  leaderboardContent.innerHTML = '';
  
  // Load based on infoType
  switch (experimentConfig.infoType) {
    case 'teamLB':
      await loadTeamLeaderboardForTab();
      break;
    case 'indLBWithin':
      await loadIndividualLeaderboardWithinTeam();
      break;
    case 'bothLBWithin':
      await loadTeamLeaderboardForTab();
      await loadIndividualLeaderboardWithinTeam();
      break;
    case 'bothLBAcross':
      await loadTeamLeaderboardForTab();
      await loadIndividualLeaderboardAcrossTeams();
      break;
    case 'socialNorm':
      await showSocialNorm();
      break;
    case 'indLBAcross':
      await loadIndividualLeaderboardAcrossTeams();
      break;
    case 'noInfo':
    default:
      // No leaderboards shown
      break;
  }
}

// Load team leaderboard for tab display
async function loadTeamLeaderboardForTab() {
  const leaderboardContent = document.getElementById('leaderboardContent');
  const section = document.createElement('div');
  section.className = 'leaderboard-section';
  section.innerHTML = `
    <h3>Team Leaderboard</h3>
    <div class="leaderboard-container">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Total Contribution</th>
          </tr>
        </thead>
        <tbody id="teamLeaderboardTabBody">
        </tbody>
      </table>
    </div>
  `;
  leaderboardContent.appendChild(section);
  
  // Get all groups and their total contributions
  const groupsSnapshot = await db.collection('groups').get();
  const groupTotals = {};
  
  // Calculate focal team's total
  let focalTeamTotal = 0;
  const focalContributions = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .get();
  focalContributions.forEach(doc => {
    focalTeamTotal += doc.data().contribution;
  });
  
  // Get other teams' totals
  for (const groupDoc of groupsSnapshot.docs) {
    const gid = groupDoc.id;
    if (gid === groupId) continue; // Skip focal team, already calculated
    
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', gid)
      .get();
    
    let total = 0;
    contributionsSnapshot.forEach(doc => {
      total += doc.data().contribution;
    });
    
    groupTotals[gid] = total;
  }
  
  // Determine target position for focal team based on teamContribution (high = top 25%, low = bottom 25%)
  const allTeamTotals = Object.values(groupTotals);
  allTeamTotals.push(focalTeamTotal);
  allTeamTotals.sort((a, b) => b - a);
  
  let targetRank;
  const totalTeams = allTeamTotals.length;
  const top25Percent = Math.max(1, Math.floor(totalTeams * 0.25));
  const bottom25Percent = Math.max(1, Math.floor(totalTeams * 0.75));
  
  // Check if team LB stability should maintain ranks (high = 85% maintain, low = 25% maintain)
  const shouldMaintainRank = experimentConfig.teamLBStability === 'high' 
    ? (currentRound <= Math.floor(totalRounds * 0.5))
    : (currentRound <= Math.floor(totalRounds * 0.5));
  
  if (shouldMaintainRank && currentRound > 1) {
    // Maintain previous rank (85% or 25% of rounds depending on stability level)
    // For simplicity, use the teamContribution setting consistently
    if (experimentConfig.teamContribution === 'high') {
      targetRank = top25Percent; // Top 25%
    } else {
      targetRank = bottom25Percent; // Bottom 25%
    }
  } else {
    // Allow rank to change (50% of rounds for both high and low stability)
    if (experimentConfig.teamContribution === 'high') {
      // High condition: target top 25%
      targetRank = Math.floor(Math.random() * top25Percent) + 1;
    } else {
      // Low condition: target bottom 25%
      targetRank = bottom25Percent + Math.floor(Math.random() * (totalTeams - bottom25Percent));
    }
  }
  
  // Create simulated teams to ensure focal team is at target rank
  // We need enough teams so focal team can be positioned correctly
  const minTeamsNeeded = Math.max(10, targetRank + 2);
  const simulatedTeams = [];
  
  // Generate simulated team totals to position focal team correctly
  const sortedOtherTeams = Object.entries(groupTotals).sort((a, b) => b[1] - a[1]);
  
  // Calculate what other teams should have to position focal team at target rank
  for (let i = 0; i < minTeamsNeeded - 1; i++) {
    let simulatedTotal;
    if (i < targetRank - 1) {
      // Teams above focal team should have higher totals
      simulatedTotal = focalTeamTotal + (minTeamsNeeded - i) * 5;
    } else {
      // Teams below focal team should have lower totals
      simulatedTotal = Math.max(0, focalTeamTotal - (i - targetRank + 2) * 5);
    }
    
    // Use real team if available, otherwise use simulated
    if (i < sortedOtherTeams.length) {
      // Adjust real team's displayed total to position correctly
      groupTotals[sortedOtherTeams[i][0]] = simulatedTotal;
    } else {
      simulatedTeams.push({
        id: `SIM_TEAM_${i}`,
        total: simulatedTotal
      });
    }
  }
  
  // Combine real and simulated teams
  const allTeams = [];
  Object.entries(groupTotals).forEach(([gid, total]) => {
    allTeams.push({ id: gid, total: total, isSimulated: false });
  });
  simulatedTeams.forEach(team => {
    allTeams.push({ id: team.id, total: team.total, isSimulated: true });
  });
  
  // Add focal team
  allTeams.push({ id: groupId, total: focalTeamTotal, isSimulated: false, isFocal: true });
  
  // Sort by total
  allTeams.sort((a, b) => b.total - a.total);
  
  // Assign unique team numbers: focal team is always Team 5, others are 1-4, 6-10
  const availableNumbers = [1, 2, 3, 4, 6, 7, 8, 9, 10]; // Skip 5 for focal team
  let numberIndex = 0;
  const teamNumberMap = new Map();
  
  // Always assign Team 5 to focal team
  teamNumberMap.set(groupId, 5);
  
  // Assign numbers 1-4, 6-10 to all other teams
  allTeams.forEach(team => {
    if (team.isFocal) return; // Skip focal team
    
    if (!teamNumberMap.has(team.id) && numberIndex < availableNumbers.length) {
      teamNumberMap.set(team.id, availableNumbers[numberIndex]);
      numberIndex++;
    }
  });
  
  // Display top 10
  const tbody = document.getElementById('teamLeaderboardTabBody');
  tbody.innerHTML = '';
  
  allTeams.slice(0, 10).forEach((team, index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    let teamName;
    if (team.isFocal) {
      teamName = 'Your Team'; // Display as "Your Team" but internally it's Team 5
    } else {
      const teamNum = teamNumberMap.get(team.id) || availableNumbers[numberIndex % availableNumbers.length];
      teamName = `Team ${teamNum}`;
    }
    row.insertCell(1).textContent = teamName;
    row.insertCell(2).textContent = team.total;
    
    if (team.isFocal) {
      row.style.backgroundColor = '#e3f2fd';
      row.style.fontWeight = 'bold';
    } else if (team.isSimulated) {
      row.style.opacity = '0.7';
    }
  });
}

// Load individual leaderboard within team
async function loadIndividualLeaderboardWithinTeam() {
  const leaderboardContent = document.getElementById('leaderboardContent');
  const section = document.createElement('div');
  section.className = 'leaderboard-section';
  section.innerHTML = `
    <h3>Individual Leaderboard (Your Team)</h3>
    <div class="leaderboard-container">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Member</th>
            <th>Total Contribution</th>
          </tr>
        </thead>
        <tbody id="individualWithinTeamBody">
        </tbody>
      </table>
    </div>
  `;
  leaderboardContent.appendChild(section);
  
  // Initialize member totals - ensure all 6 members are included
  const memberTotals = {};
  
  // Add focal user (You) - get from participants collection
  const participantDoc = await db.collection('participants').doc(participantId).get();
  if (participantDoc.exists) {
    memberTotals[participantId] = participantDoc.data().totalContribution || 0;
  } else {
    memberTotals[participantId] = 0;
  }
  
  // Add all 5 simulated members (Team Member 1-5)
  for (let i = 1; i <= 5; i++) {
    const simId = `SIM_${groupId}_${i}`;
    memberTotals[simId] = 0; // Initialize to 0
  }
  
  // Get all contributions for this group - only current user and simulated members
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .get();
  
  contributionsSnapshot.forEach(doc => {
    const data = doc.data();
    const pid = data.participantId;
    // Only include current user or simulated members (isSimulated flag or SIM_ prefix)
    if (pid === participantId || data.isSimulated === true || pid.startsWith('SIM_')) {
      // Accumulate contributions across all rounds
      if (!memberTotals[pid]) {
        memberTotals[pid] = 0;
      }
      memberTotals[pid] += data.contribution;
    }
  });
  
  // Sort by total
  const sorted = Object.entries(memberTotals)
    .sort((a, b) => b[1] - a[1]);
  
  // Apply individual LB stability: maintain ranks at 85% or 25% level
  // The actual rank maintenance is handled in getSimulatedTeamContributions
  // Here we just display the sorted order
  const tbody = document.getElementById('individualWithinTeamBody');
  tbody.innerHTML = '';
  
  sorted.forEach(([pid, total], index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    let memberName;
    if (pid === participantId) {
      memberName = 'You';
    } else if (pid.startsWith('SIM_')) {
      // Extract member number from SIM_groupId_memberNum format
      const parts = pid.split('_');
      const memberNum = parts.length > 2 ? parts[2] : '1';
      memberName = `Team Member ${memberNum}`;
    } else {
      // Fallback for simulated members without SIM_ prefix
      memberName = `Team Member ${pid}`;
    }
    row.insertCell(1).textContent = memberName;
    row.insertCell(2).textContent = total;
    if (pid === participantId) {
      row.style.backgroundColor = '#e3f2fd';
      row.style.fontWeight = 'bold';
    }
  });
}

// Load individual leaderboard across all teams
async function loadIndividualLeaderboardAcrossTeams() {
  const leaderboardContent = document.getElementById('leaderboardContent');
  const section = document.createElement('div');
  section.className = 'leaderboard-section';
  section.innerHTML = `
    <h3>Individual Leaderboard (All Teams)</h3>
    <div class="leaderboard-container">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Total Contribution</th>
          </tr>
        </thead>
        <tbody id="individualAcrossTeamsBody">
        </tbody>
      </table>
    </div>
  `;
  leaderboardContent.appendChild(section);
  
  // Get contributions for current user and simulated members only
  // Get current user's total from participants collection
  const currentUserDoc = await db.collection('participants').doc(participantId).get();
  const currentUserTotal = currentUserDoc.exists ? (currentUserDoc.data().totalContribution || 0) : 0;
  
  // Get simulated members' contributions from contributions collection
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .get();
  
  const playerTotals = [
    { id: participantId, total: currentUserTotal, isSimulated: false }
  ];
  
  contributionsSnapshot.forEach(doc => {
    const data = doc.data();
    const pid = data.participantId;
    // Only include simulated members (isSimulated flag or SIM_ prefix)
    if ((data.isSimulated === true || pid.startsWith('SIM_')) && pid !== participantId) {
      // Check if we already have this simulated member
      const existingIndex = playerTotals.findIndex(p => p.id === pid);
      if (existingIndex >= 0) {
        playerTotals[existingIndex].total += data.contribution;
      } else {
        playerTotals.push({
          id: pid,
          total: data.contribution,
          isSimulated: true
        });
      }
    }
  });
  
  // Sort by total
  playerTotals.sort((a, b) => b.total - a.total);
  
  const tbody = document.getElementById('individualAcrossTeamsBody');
  tbody.innerHTML = '';
  
  playerTotals.slice(0, 20).forEach((player, index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    
    let displayName;
    if (player.id === participantId) {
      displayName = 'You';
    } else if (player.id.startsWith('SIM_')) {
      // Extract member number from SIM_groupId_memberNum format
      const parts = player.id.split('_');
      const memberNum = parts.length > 2 ? parts[2] : '1';
      displayName = `Team Member ${memberNum}`;
    } else {
      displayName = `Team Member ${player.id}`;
    }
    
    row.insertCell(1).textContent = displayName;
    row.insertCell(2).textContent = player.total;
    if (player.id === participantId) {
      row.style.backgroundColor = '#e3f2fd';
      row.style.fontWeight = 'bold';
    }
  });
}

// Show social norm information
async function showSocialNorm() {
  // Get team contributions for current round
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .where('round', '==', currentRound)
    .get();
  
  const contributions = [];
  contributionsSnapshot.forEach(doc => {
    contributions.push(doc.data().contribution);
  });
  
  if (contributions.length === 0) return;
  
  // Calculate average
  const avg = contributions.reduce((sum, c) => sum + c, 0) / contributions.length;
  
  // For social norm infoType, always show average and standard deviation
  const variance = contributions.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / contributions.length;
  const stdDev = Math.sqrt(variance);
  
  // Display in social norm panel
  const socialNormPanel = document.getElementById('socialNormPanel');
  const socialNormContent = document.getElementById('socialNormContent');
  
  if (socialNormPanel && socialNormContent) {
    let html = '<div class="social-norm-stats">';
    html += `<div class="social-norm-stat">
      <div class="social-norm-stat-label">Team Average</div>
      <div class="social-norm-stat-value">${avg.toFixed(2)}</div>
    </div>`;
    
    // Always show standard deviation for social norm infoType
    html += `<div class="social-norm-stat">
      <div class="social-norm-stat-label">Standard Deviation</div>
      <div class="social-norm-stat-value">${stdDev.toFixed(2)}</div>
    </div>`;
    
    html += '</div>';
    socialNormContent.innerHTML = html;
    socialNormPanel.classList.remove('hidden');
  }
  
  // Also show in leaderboard tab
  const leaderboardContent = document.getElementById('leaderboardContent');
  if (leaderboardContent && experimentConfig.infoType === 'socialNorm') {
    const section = document.createElement('div');
    section.className = 'leaderboard-section';
    section.innerHTML = `
      <h3>Team Statistics</h3>
      <div class="social-norm-stats">
        <div class="social-norm-stat">
          <div class="social-norm-stat-label">Team Average</div>
          <div class="social-norm-stat-value">${avg.toFixed(2)}</div>
        </div>
        <div class="social-norm-stat">
          <div class="social-norm-stat-label">Standard Deviation</div>
          <div class="social-norm-stat-value">${stdDev.toFixed(2)}</div>
        </div>
      </div>
    `;
    leaderboardContent.appendChild(section);
  }
}

async function showEndScreen() {
  // Get final stats
  const participantDoc = await db.collection('participants').doc(participantId).get();
  const data = participantDoc.data();
  
  document.getElementById('finalTotalRounds').textContent = totalRounds;
  document.getElementById('finalTotalContribution').textContent = data.totalContribution || 0;
  document.getElementById('finalPayoff').textContent = (data.cumulativePayoff || 0).toFixed(2);
  document.getElementById('finalAvgContribution').textContent = ((data.totalContribution || 0) / totalRounds).toFixed(2);
  
  // Update status
  await db.collection('participants').doc(participantId).update({
    status: 'completed',
    completedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  // Show end screen
  document.getElementById('experimentScreen').classList.remove('active');
  document.getElementById('endScreen').classList.add('active');
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

// Real-time updates for leaderboards (set up after participant starts)
let leaderboardListener = null;

function setupLeaderboardListeners() {
  if (leaderboardListener) {
    leaderboardListener(); // Unsubscribe existing listener
  }
  
  // Set up listeners if infoType shows leaderboards
  if (experimentConfig.infoType !== 'noInfo' && experimentConfig.infoType !== 'socialNorm') {
    leaderboardListener = db.collection('contributions').onSnapshot(() => {
      loadLeaderboards();
    });
  }
}

