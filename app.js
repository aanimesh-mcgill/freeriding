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
let groupId = "";
let contribution = 0;
let submitted = false;
let timerInterval = null;
let timeRemaining = 0;
let cumulativePayoff = 0;

// Treatment Conditions (randomized per participant)
let showTeamLeaderboard = false;
let showIndividualLeaderboard = false;
let showContributionComparison = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadExperimentSettings();
});

function initializeEventListeners() {
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
}

async function loadExperimentSettings() {
  try {
    const settingsDoc = await db.collection('settings').doc('experiment').get();
    if (settingsDoc.exists) {
      const settings = settingsDoc.data();
      totalRounds = settings.totalRounds || 10;
      roundDuration = settings.roundDuration || 120;
      groupSize = settings.groupSize || 4;
      endowment = settings.endowment || 20;
      multiplier = settings.multiplier || 1.6;
      
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
    
    if (participantDoc.exists) {
      const data = participantDoc.data();
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
      // New participant - randomize treatments
      showTeamLeaderboard = Math.random() < 0.5;
      showIndividualLeaderboard = Math.random() < 0.5;
      showContributionComparison = Math.random() < 0.5;
      
      // Assign to group
      groupId = await assignToGroup(participantId);
      
      // Create participant record
      await db.collection('participants').doc(participantId).set({
        participantId,
        groupId,
        currentRound: 1,
        totalContribution: 0,
        cumulativePayoff: 0,
        showTeamLeaderboard,
        showIndividualLeaderboard,
        showContributionComparison,
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
  return participantDoc.exists ? participantDoc.data().currentRound : 1;
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
    
    // Check if round is complete
    await checkRoundCompletion();
    
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

async function checkRoundCompletion() {
  // Check if all group members have submitted
  const groupDoc = await db.collection('groups').doc(groupId).get();
  if (!groupDoc.exists) return;
  
  const members = groupDoc.data().members || [];
  const contributionsSnapshot = await db.collection('contributions')
    .where('groupId', '==', groupId)
    .where('round', '==', currentRound)
    .get();
  
  const submittedParticipants = new Set();
  contributionsSnapshot.forEach(doc => {
    submittedParticipants.add(doc.data().participantId);
  });
  
  // Check if all members have submitted
  if (submittedParticipants.size >= members.length) {
    // Calculate payoffs for all members
    await calculateRoundPayoffs();
    
    // Show results
    await showRoundResults();
  } else {
    // Set up listener for round completion
    const unsubscribe = db.collection('contributions')
      .where('groupId', '==', groupId)
      .where('round', '==', currentRound)
      .onSnapshot(async (snapshot) => {
        const submittedSet = new Set();
        snapshot.forEach(doc => {
          submittedSet.add(doc.data().participantId);
        });
        
        if (submittedSet.size >= members.length) {
          unsubscribe();
          await calculateRoundPayoffs();
          await showRoundResults();
        }
      });
  }
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
  cumulativePayoff = participantDoc.data().cumulativePayoff || 0;
  
  // Display results
  document.getElementById('resultYourContribution').textContent = contribution;
  document.getElementById('resultGroupTotal').textContent = groupTotal;
  document.getElementById('resultYourShare').textContent = payoffData.groupShare.toFixed(2);
  document.getElementById('resultPayoff').textContent = payoffData.payoff.toFixed(2);
  document.getElementById('resultCumulative').textContent = cumulativePayoff.toFixed(2);
  
  document.getElementById('roundResults').classList.remove('hidden');
  document.getElementById('nextRoundBtn').classList.remove('hidden');
  
  // Update contribution comparison if shown
  if (showContributionComparison) {
    await updateContributionComparison();
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
  document.getElementById('teamLeaderboardPanel').classList.toggle('hidden', !showTeamLeaderboard);
  document.getElementById('individualLeaderboardPanel').classList.toggle('hidden', !showIndividualLeaderboard);
  document.getElementById('contributionComparisonPanel').classList.toggle('hidden', !showContributionComparison);
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

