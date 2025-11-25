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
let currentRound = 1;
let totalRounds = 10;
let roundDuration = 120; // seconds
let groupSize = 4;
let endowment = 20;
let multiplier = 1.6;
let resultsDelay = 3; // seconds to wait before showing results
let groupId = "";
let contribution = 0;
let submitted = false;
let timerInterval = null;
let timeRemaining = 0;
let cumulativePayoff = 0;

// Experiment Configuration (from admin settings)
let experimentConfig = {
  // Info Display Timing
  infoDisplayTiming: 'eachRound', // 'eachRound' or 'endOnly'
  
  // What Info is Displayed
  showTeamLeaderboard: false,
  showIndividualLeaderboardWithinTeam: false,
  showIndividualLeaderboardAcrossTeams: false,
  
  // Leaderboard Stability
  leaderboardStability: 'stable', // 'stable' or 'dynamic'
  
  // Social Norm Display
  socialNormDisplay: 'none', // 'avgAndStdDev', 'avgOnly', 'none'
  
  // Focal User Condition
  focalUserCondition: 'random', // 'freeRider' or 'random'
  
  // Simulated Team Members
  simulatedTeamSize: 3, // Number of simulated team members (total group size = 4)
  simulatedTeamContributions: [] // Will be generated based on condition
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
      groupSize = settings.groupSize || 4;
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
      experimentConfig.simulatedTeamSize = groupSize - 1; // Total group size minus the focal user
      
      document.getElementById('totalRounds').textContent = totalRounds;
    }
  } catch (error) {
    console.log('Using default settings:', error);
  }
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
    
    if (data) {
      currentRound = data.currentRound || 1;
      groupId = data.groupId || '';
      cumulativePayoff = data.cumulativePayoff || 0;
      showTeamLeaderboard = data.showTeamLeaderboard || false;
      showIndividualLeaderboard = data.showIndividualLeaderboard || false;
      showContributionComparison = data.showContributionComparison || false;
      
      if (currentRound > totalRounds) {
        showEndScreen();
        return;
      }
    } else {
      // New participant - use experiment config from settings
      // Assign to group (same group for all rounds)
      groupId = await assignToGroup(participantId);
      
      // Generate simulated team member contributions for all rounds
      await generateSimulatedTeamContributions(groupId);
      
      // Create participant record with experiment config
      await db.collection('participants').doc(participantId).set({
        participantId,
        groupId,
        currentRound: 1,
        totalContribution: 0,
        cumulativePayoff: 0,
        experimentConfig: experimentConfig,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      });
    }
    
    // Show experiment screen
    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('experimentScreen').classList.add('active');
    
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
    const baseContributions = [];
    for (let i = 0; i < numSimulated; i++) {
      // Simulated members contribute between 8-15 tokens on average
      let contribution;
      if (experimentConfig.leaderboardStability === 'stable') {
        // Stable: higher contributors stay high, lower stay low
        const rank = i / (numSimulated - 1); // 0 to 1
        contribution = Math.round(7 + rank * 8); // 7 to 15
      } else {
        // Dynamic: contributions vary more
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
  
  // Adjust based on focal user condition
  if (experimentConfig.focalUserCondition === 'freeRider') {
    // Focal user is always much lower - make simulated members contribute more
    const targetAvg = focalUserContribution + (endowment * 0.4); // Simulated members contribute 40% more on average
    const adjustment = targetAvg - simAvg;
    
    contributions.forEach(c => {
      adjustedContributions.push({
        ...c,
        contribution: Math.max(0, Math.min(endowment, Math.round(c.contribution + adjustment)))
      });
    });
  } else {
    // Random condition - sometimes higher, sometimes lower, sometimes same
    const randomFactor = Math.random();
    let adjustment;
    
    if (randomFactor < 0.33) {
      // Focal user higher than average
      adjustment = (focalUserContribution - simAvg) * 0.8; // Simulated members slightly lower
    } else if (randomFactor < 0.66) {
      // Focal user lower than average
      adjustment = (focalUserContribution - simAvg) * 0.8; // Simulated members slightly higher
    } else {
      // Focal user similar to average
      adjustment = 0; // Keep similar
    }
    
    contributions.forEach(c => {
      adjustedContributions.push({
        ...c,
        contribution: Math.max(0, Math.min(endowment, Math.round(c.contribution + adjustment)))
      });
    });
  }
  
  return adjustedContributions;
}

async function loadRound() {
  currentRound = parseInt(await getCurrentRound());
  
  if (currentRound > totalRounds) {
    showEndScreen();
    return;
  }
  
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
  
  submitted = false;
  contribution = 0;
  
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
  
  // Update treatment panels visibility
  updateTreatmentPanels();
  
  // Load leaderboards if needed
  if (showTeamLeaderboard) {
    await loadTeamLeaderboard();
  }
  if (showIndividualLeaderboard) {
    await loadIndividualLeaderboard();
  }
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
  
  showLoading(true);
  
  try {
    // Save contribution
    await db.collection('contributions').add({
      participantId,
      groupId,
      round: currentRound,
      contribution,
      endowment,
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
    
    // Save payoff
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
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update participant cumulative payoff
    const participantRef = db.collection('participants').doc(pid);
    batch.update(participantRef, {
      cumulativePayoff: firebase.firestore.FieldValue.increment(payoff),
      lastActivity: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  
  // Update round status
  await db.collection('rounds').doc(`${groupId}_${currentRound}`).set({
    groupId,
    round: currentRound,
    groupTotal,
    groupShare,
    completed: true,
    completedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
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
  
  // Hide decision section immediately
  const decisionSection = document.getElementById('decision-section');
  if (decisionSection) {
    decisionSection.style.display = 'none';
  }
  
  // Wait for configured delay before showing results
  setTimeout(() => {
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
    
    // Show leaderboards and social norm based on config
    if (experimentConfig.infoDisplayTiming === 'eachRound') {
      // Load and show leaderboards
      await loadLeaderboards();
      
      // Show social norm if enabled
      if (experimentConfig.socialNormDisplay !== 'none') {
        await showSocialNorm();
      }
      
      // Auto-switch to leaderboard tab if any leaderboard is enabled
      if (experimentConfig.showTeamLeaderboard || 
          experimentConfig.showIndividualLeaderboardWithinTeam || 
          experimentConfig.showIndividualLeaderboardAcrossTeams) {
        setTimeout(() => {
          switchTab('leaderboard');
        }, 500);
      }
    }
    
    // Update contribution comparison if shown
    if (showContributionComparison) {
      updateContributionComparison();
    }
  }, resultsDelay * 1000);
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
  // Get all groups and their total contributions
  const groupsSnapshot = await db.collection('groups').get();
  const groupTotals = {};
  
  for (const groupDoc of groupsSnapshot.docs) {
    const groupId = groupDoc.id;
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', groupId)
      .get();
    
    let total = 0;
    contributionsSnapshot.forEach(doc => {
      total += doc.data().contribution;
    });
    
    groupTotals[groupId] = total;
  }
  
  // Sort by total
  const sorted = Object.entries(groupTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10
  
  const tbody = document.getElementById('teamLeaderboardBody');
  tbody.innerHTML = '';
  
  sorted.forEach(([gid, total], index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = `Group ${gid.substring(0, 8)}`;
    row.insertCell(2).textContent = total;
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
  // Update based on experiment config and timing
  const showInfo = experimentConfig.infoDisplayTiming === 'eachRound';
  
  document.getElementById('teamLeaderboardPanel').classList.toggle('hidden', !showInfo || !experimentConfig.showTeamLeaderboard);
  document.getElementById('individualLeaderboardPanel').classList.toggle('hidden', !showInfo || !experimentConfig.showIndividualLeaderboardAcrossTeams);
  document.getElementById('contributionComparisonPanel').classList.toggle('hidden', !showInfo);
}

// Load all leaderboards for the leaderboard tab
async function loadLeaderboards() {
  const leaderboardContent = document.getElementById('leaderboardContent');
  if (!leaderboardContent) return;
  
  leaderboardContent.innerHTML = '';
  
  // Load team leaderboard if enabled
  if (experimentConfig.showTeamLeaderboard) {
    await loadTeamLeaderboardForTab();
  }
  
  // Load individual leaderboard within team if enabled
  if (experimentConfig.showIndividualLeaderboardWithinTeam) {
    await loadIndividualLeaderboardWithinTeam();
  }
  
  // Load individual leaderboard across teams if enabled
  if (experimentConfig.showIndividualLeaderboardAcrossTeams) {
    await loadIndividualLeaderboardAcrossTeams();
  }
  
  // Show social norm if enabled
  if (experimentConfig.socialNormDisplay !== 'none') {
    await showSocialNorm();
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
  
  for (const groupDoc of groupsSnapshot.docs) {
    const gid = groupDoc.id;
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', gid)
      .get();
    
    let total = 0;
    contributionsSnapshot.forEach(doc => {
      total += doc.data().contribution;
    });
    
    groupTotals[gid] = total;
  }
  
  // Sort by total
  const sorted = Object.entries(groupTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const tbody = document.getElementById('teamLeaderboardTabBody');
  tbody.innerHTML = '';
  
  sorted.forEach(([gid, total], index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = `Group ${gid.substring(0, 8)}`;
    row.insertCell(2).textContent = total;
    if (gid === groupId) {
      row.style.backgroundColor = '#e3f2fd';
      row.style.fontWeight = 'bold';
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
  
  // Get all contributions for this group
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .get();
  
  const memberTotals = {};
  contributionsSnapshot.forEach(doc => {
    const pid = doc.data().participantId;
    memberTotals[pid] = (memberTotals[pid] || 0) + doc.data().contribution;
  });
  
  // Sort by total
  const sorted = Object.entries(memberTotals)
    .sort((a, b) => b[1] - a[1]);
  
  const tbody = document.getElementById('individualWithinTeamBody');
  tbody.innerHTML = '';
  
  sorted.forEach(([pid, total], index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    const memberName = pid.startsWith('SIM_') ? `Team Member ${pid.split('_')[2]}` : pid;
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
  
  // Get all participants and their total contributions (excluding simulated)
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
  
  const tbody = document.getElementById('individualAcrossTeamsBody');
  tbody.innerHTML = '';
  
  playerTotals.slice(0, 20).forEach((player, index) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = player.id;
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
  
  // Calculate standard deviation if needed
  let stdDev = 0;
  if (experimentConfig.socialNormDisplay === 'avgAndStdDev') {
    const variance = contributions.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / contributions.length;
    stdDev = Math.sqrt(variance);
  }
  
  // Display in social norm panel
  const socialNormPanel = document.getElementById('socialNormPanel');
  const socialNormContent = document.getElementById('socialNormContent');
  
  if (socialNormPanel && socialNormContent) {
    let html = '<div class="social-norm-stats">';
    html += `<div class="social-norm-stat">
      <div class="social-norm-stat-label">Team Average</div>
      <div class="social-norm-stat-value">${avg.toFixed(2)}</div>
    </div>`;
    
    if (experimentConfig.socialNormDisplay === 'avgAndStdDev') {
      html += `<div class="social-norm-stat">
        <div class="social-norm-stat-label">Standard Deviation</div>
        <div class="social-norm-stat-value">${stdDev.toFixed(2)}</div>
      </div>`;
    }
    
    html += '</div>';
    socialNormContent.innerHTML = html;
    socialNormPanel.classList.remove('hidden');
  }
  
  // Also show in leaderboard tab
  const leaderboardContent = document.getElementById('leaderboardContent');
  if (leaderboardContent && experimentConfig.infoDisplayTiming === 'eachRound') {
    const section = document.createElement('div');
    section.className = 'leaderboard-section';
    section.innerHTML = `
      <h3>Team Statistics</h3>
      <div class="social-norm-stats">
        <div class="social-norm-stat">
          <div class="social-norm-stat-label">Team Average</div>
          <div class="social-norm-stat-value">${avg.toFixed(2)}</div>
        </div>
        ${experimentConfig.socialNormDisplay === 'avgAndStdDev' ? `
        <div class="social-norm-stat">
          <div class="social-norm-stat-label">Standard Deviation</div>
          <div class="social-norm-stat-value">${stdDev.toFixed(2)}</div>
        </div>` : ''}
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
  
  if (showTeamLeaderboard || showIndividualLeaderboard) {
    leaderboardListener = db.collection('contributions').onSnapshot(() => {
      if (showTeamLeaderboard) loadTeamLeaderboard();
      if (showIndividualLeaderboard) loadIndividualLeaderboard();
    });
  }
}

