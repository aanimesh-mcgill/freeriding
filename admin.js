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

// Admin password (stored in Firestore settings, default is 'admin123')
let adminPassword = 'admin123';

// Check password on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Load admin password from settings
  try {
    const settingsDoc = await db.collection('settings').doc('admin').get();
    if (settingsDoc.exists && settingsDoc.data().password) {
      adminPassword = settingsDoc.data().password;
    }
  } catch (error) {
    console.log('Using default password');
  }
  
  // Set up password screen
  setupPasswordScreen();
});

function setupPasswordScreen() {
  const passwordScreen = document.getElementById('passwordScreen');
  const adminContainer = document.getElementById('adminContainer');
  const passwordInput = document.getElementById('passwordInput');
  const passwordSubmitBtn = document.getElementById('passwordSubmitBtn');
  const passwordError = document.getElementById('passwordError');
  
  // Check if already authenticated (session storage)
  const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
  if (isAuthenticated) {
    showAdminDashboard();
    return;
  }
  
  // Show password screen
  passwordScreen.style.display = 'flex';
  adminContainer.classList.add('hidden');
  
  // Handle Enter key
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
  
  // Handle submit button
  passwordSubmitBtn.addEventListener('click', checkPassword);
  
  function checkPassword() {
    const enteredPassword = passwordInput.value;
    
    if (enteredPassword === adminPassword) {
      // Correct password - show admin dashboard
      sessionStorage.setItem('adminAuthenticated', 'true');
      showAdminDashboard();
    } else {
      // Wrong password
      passwordError.textContent = 'Incorrect password. Please try again.';
      passwordError.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  }
}

function showAdminDashboard() {
  const passwordScreen = document.getElementById('passwordScreen');
  const adminContainer = document.getElementById('adminContainer');
  
  passwordScreen.style.display = 'none';
  adminContainer.classList.remove('hidden');
  
  // Initialize admin dashboard
  initializeEventListeners();
  loadExperimentSettings();
  loadDashboardData();
  
  // Set up real-time listeners
  setupRealtimeListeners();
}

function initializeEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', loadDashboardData);
  document.getElementById('exportBtn').addEventListener('click', exportToExcel);
  document.getElementById('resetBtn').addEventListener('click', confirmReset);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  // Participant search event listeners are set up in the new search functions
}

async function loadExperimentSettings() {
  try {
    const settingsDoc = await db.collection('settings').doc('experiment').get();
    const settings = settingsDoc.data();
    if (settings) {
      document.getElementById('totalRoundsSetting').value = settings.totalRounds || 10;
      document.getElementById('roundDurationSetting').value = settings.roundDuration || 120;
      document.getElementById('groupSizeSetting').value = settings.groupSize || 6;
      document.getElementById('totalTeamsSetting').value = settings.totalTeams || 10;
      document.getElementById('endowmentSetting').value = settings.endowment || 20;
      document.getElementById('multiplierSetting').value = settings.multiplier || 1.6;
      document.getElementById('resultsDelaySetting').value = settings.resultsDelay || 3;
      
      // Experiment factors
      document.getElementById('infoDisplayTimingSetting').value = settings.infoDisplayTiming || 'eachRound';
      document.getElementById('focalUserConditionSetting').value = settings.focalUserCondition || 'random';
      document.getElementById('leaderboardStabilitySetting').value = settings.leaderboardStability || 'stable';
      document.getElementById('socialNormDisplaySetting').value = settings.socialNormDisplay || 'none';
      document.getElementById('socialNormAverageHighSetting').value = settings.socialNormAverageHigh || 16;
      document.getElementById('socialNormAverageLowSetting').value = settings.socialNormAverageLow || 6;
      document.getElementById('socialNormStdDevSetting').value = settings.socialNormStdDev || 2;
      document.getElementById('focalMemberTeamRankSetting').value = settings.focalMemberTeamRank || 'middle';
      document.getElementById('teamLeaderboardRankingStabilitySetting').value = settings.teamLeaderboardRankingStability || 'stable';
      
      // Information display options
      document.getElementById('showTeamLeaderboardSetting').checked = settings.showTeamLeaderboard || false;
      document.getElementById('showIndividualLeaderboardWithinTeamSetting').checked = settings.showIndividualLeaderboardWithinTeam || false;
      document.getElementById('showIndividualLeaderboardAcrossTeamsSetting').checked = settings.showIndividualLeaderboardAcrossTeams || false;
      document.getElementById('showTreatmentConditionsIconSetting').checked = settings.showTreatmentConditionsIcon !== undefined ? settings.showTreatmentConditionsIcon : true;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  const settings = {
    totalRounds: parseInt(document.getElementById('totalRoundsSetting').value),
    roundDuration: parseInt(document.getElementById('roundDurationSetting').value),
    groupSize: parseInt(document.getElementById('groupSizeSetting').value),
    totalTeams: parseInt(document.getElementById('totalTeamsSetting').value),
    endowment: parseInt(document.getElementById('endowmentSetting').value),
    multiplier: parseFloat(document.getElementById('multiplierSetting').value),
    resultsDelay: parseInt(document.getElementById('resultsDelaySetting').value),
    
    // Experiment factors
    infoDisplayTiming: document.getElementById('infoDisplayTimingSetting').value,
    focalUserCondition: document.getElementById('focalUserConditionSetting').value,
    leaderboardStability: document.getElementById('leaderboardStabilitySetting').value,
    socialNormDisplay: document.getElementById('socialNormDisplaySetting').value,
    socialNormAverageHigh: parseFloat(document.getElementById('socialNormAverageHighSetting').value),
    socialNormAverageLow: parseFloat(document.getElementById('socialNormAverageLowSetting').value),
    socialNormStdDev: parseFloat(document.getElementById('socialNormStdDevSetting').value),
    focalMemberTeamRank: document.getElementById('focalMemberTeamRankSetting').value,
    teamLeaderboardRankingStability: document.getElementById('teamLeaderboardRankingStabilitySetting').value,
    
    // Information display options
    showTeamLeaderboard: document.getElementById('showTeamLeaderboardSetting').checked,
    showIndividualLeaderboardWithinTeam: document.getElementById('showIndividualLeaderboardWithinTeamSetting').checked,
    showIndividualLeaderboardAcrossTeams: document.getElementById('showIndividualLeaderboardAcrossTeamsSetting').checked,
    showTreatmentConditionsIcon: document.getElementById('showTreatmentConditionsIconSetting').checked,
    
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    await db.collection('settings').doc('experiment').set(settings, { merge: true });
    alert('Settings saved successfully!');
    loadDashboardData();
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

async function loadDashboardData() {
  await Promise.all([
    loadStatistics(),
    loadParticipants(),
    loadGroups(),
    loadRoundData(),
    loadTreatmentDistribution()
  ]);
}

async function loadStatistics() {
  try {
    // Total participants
    const participantsSnapshot = await db.collection('participants').get();
    const totalParticipants = participantsSnapshot.size;
    
    // Active participants
    let activeParticipants = 0;
    participantsSnapshot.forEach(doc => {
      if (doc.data().status === 'active') activeParticipants++;
    });
    
    // Total contributions
    const contributionsSnapshot = await db.collection('contributions').get();
    let totalContributions = 0;
    contributionsSnapshot.forEach(doc => {
      totalContributions += doc.data().contribution || 0;
    });
    
    // Average contribution
    const avgContribution = contributionsSnapshot.size > 0 
      ? (totalContributions / contributionsSnapshot.size).toFixed(2)
      : 0;
    
    // Total payoffs
    const payoffsSnapshot = await db.collection('payoffs').get();
    let totalPayoffs = 0;
    payoffsSnapshot.forEach(doc => {
      totalPayoffs += doc.data().payoff || 0;
    });
    
    // Completed rounds
    const roundsSnapshot = await db.collection('rounds').get();
    const completedRounds = roundsSnapshot.size;
    
    // Update UI
    document.getElementById('statTotalParticipants').textContent = totalParticipants;
    document.getElementById('statActiveParticipants').textContent = activeParticipants;
    document.getElementById('statCompletedRounds').textContent = completedRounds;
    document.getElementById('statTotalContributions').textContent = totalContributions;
    document.getElementById('statAvgContribution').textContent = avgContribution;
    document.getElementById('statTotalPayoffs').textContent = totalPayoffs.toFixed(2);
    
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

let currentSearchedParticipantId = null;

async function searchParticipant() {
  const searchInput = document.getElementById('participantSearchInput').value.trim();
  if (!searchInput) {
    alert('Please enter a Participant ID or Unique ID');
    return;
  }
  
  try {
    // Try to find by participantId first
    let participantDoc = await db.collection('participants').doc(searchInput).get();
    
    // If not found, try to find by uniqueParticipantId
    if (!participantDoc.exists) {
      const participantsSnapshot = await db.collection('participants')
        .where('uniqueParticipantId', '==', searchInput)
        .limit(1)
        .get();
      
      if (!participantsSnapshot.empty) {
        participantDoc = participantsSnapshot.docs[0];
      }
    }
    
    if (!participantDoc.exists) {
      alert('Participant not found. Please check the ID and try again.');
      return;
    }
    
    const participantData = participantDoc.exists ? participantDoc.data() : participantDoc.data();
    currentSearchedParticipantId = participantData.participantId;
    
    // Show participant details
    displayParticipantDetails(participantData);
    
  } catch (error) {
    console.error('Error searching participant:', error);
    alert('Error searching for participant. Please try again.');
  }
}

function clearParticipantSearch() {
  document.getElementById('participantSearchInput').value = '';
  document.getElementById('participantDetailsSection').style.display = 'none';
  currentSearchedParticipantId = null;
}

async function displayParticipantDetails(participantData) {
  // Show the details section
  document.getElementById('participantDetailsSection').style.display = 'block';
  
  // Display basic info
  const basicInfo = document.getElementById('participantBasicInfo');
  const config = participantData.experimentConfig || {};
  basicInfo.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
      <div><strong>Participant ID:</strong> ${participantData.participantId}</div>
      <div><strong>Unique ID:</strong> ${participantData.uniqueParticipantId || 'N/A'}</div>
      <div><strong>Group ID:</strong> ${participantData.groupId ? participantData.groupId.substring(0, 12) + '...' : 'N/A'}</div>
      <div><strong>Current Round:</strong> ${participantData.currentRound || 0}</div>
      <div><strong>Total Contribution:</strong> ${participantData.totalContribution || 0}</div>
      <div><strong>Cumulative Payoff:</strong> ${(participantData.cumulativePayoff || 0).toFixed(2)}</div>
      <div><strong>Status:</strong> <span class="status-${participantData.status || 'unknown'}">${participantData.status || 'unknown'}</span></div>
      <div><strong>Cell:</strong> ${config.betweenSubjectCell || 'N/A'}</div>
      <div><strong>Info Type:</strong> ${config.infoType || 'N/A'}</div>
      <div><strong>Focal User Level:</strong> ${config.focalUserContributionLevel || 'N/A'}</div>
    </div>
  `;
  
  // Load competing teams
  await loadCompetingTeams(participantData.participantId, participantData.groupId);
  
  // Load team members
  await loadTeamMembers(participantData.groupId);
  
  // Load rounds
  await loadParticipantRounds(participantData.participantId);
}

async function loadCompetingTeams(participantId, userTeamId) {
  try {
    // Get all teams for this participant's experiment session
    const teamsSnapshot = await db.collection('groups')
      .where('participantId', '==', participantId)
      .get();
    
    const container = document.getElementById('competingTeamsContainer');
    container.innerHTML = '';
    
    if (teamsSnapshot.empty) {
      container.innerHTML = '<p style="color: #666;">No teams found for this participant.</p>';
      return;
    }
    
    // Get contributions for each team to calculate totals
    const teamsData = [];
    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const teamId = teamDoc.id;
      
      // Get total contributions for this team
      const contributionsSnapshot = await db.collection('contributions')
        .where('groupId', '==', teamId)
        .get();
      
      let teamTotal = 0;
      contributionsSnapshot.forEach(doc => {
        teamTotal += doc.data().contribution || 0;
      });
      
      teamsData.push({
        id: teamId,
        teamNumber: teamData.teamNumber || 'N/A',
        isUserTeam: teamId === userTeamId,
        totalContribution: teamTotal,
        memberCount: teamData.memberCount || 0
      });
    }
    
    // Sort by team number
    teamsData.sort((a, b) => {
      if (typeof a.teamNumber === 'number' && typeof b.teamNumber === 'number') {
        return a.teamNumber - b.teamNumber;
      }
      return 0;
    });
    
    // Display teams
    const table = document.createElement('table');
    table.className = 'data-table';
    table.style.width = '100%';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Team #</th>
          <th>Team ID</th>
          <th>Total Contribution</th>
          <th>Members</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${teamsData.map(team => `
          <tr style="${team.isUserTeam ? 'background-color: #e3f2fd; font-weight: bold;' : ''}">
            <td>${team.isUserTeam ? 'Your Team (5)' : team.teamNumber}</td>
            <td>${team.id.substring(0, 12)}...</td>
            <td>${team.totalContribution}</td>
            <td>${team.memberCount}</td>
            <td>${team.isUserTeam ? 'Focal Team' : 'Competing Team'}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    container.appendChild(table);
    
  } catch (error) {
    console.error('Error loading competing teams:', error);
    document.getElementById('competingTeamsContainer').innerHTML = 
      '<p style="color: #e74c3c;">Error loading teams.</p>';
  }
}

async function loadTeamMembers(groupId) {
  try {
    // Get all contributions for this team to identify members
    const contributionsSnapshot = await db.collection('contributions')
      .where('groupId', '==', groupId)
      .get();
    
    const members = new Map();
    
    contributionsSnapshot.forEach(doc => {
      const data = doc.data();
      const pid = data.participantId;
      if (!members.has(pid)) {
        members.set(pid, {
          participantId: pid,
          isSimulated: data.isSimulated || pid.startsWith('SIM_'),
          totalContribution: 0,
          rounds: 0
        });
      }
      const member = members.get(pid);
      member.totalContribution += data.contribution || 0;
      member.rounds++;
    });
    
    const container = document.getElementById('teamMembersContainer');
    container.innerHTML = '';
    
    if (members.size === 0) {
      container.innerHTML = '<p style="color: #666;">No team members found.</p>';
      return;
    }
    
    const membersArray = Array.from(members.values()).sort((a, b) => {
      // Sort: real participant first, then by contribution
      if (a.isSimulated && !b.isSimulated) return 1;
      if (!a.isSimulated && b.isSimulated) return -1;
      return b.totalContribution - a.totalContribution;
    });
    
    const table = document.createElement('table');
    table.className = 'data-table';
    table.style.width = '100%';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Member</th>
          <th>Type</th>
          <th>Total Contribution</th>
          <th>Rounds</th>
        </tr>
      </thead>
      <tbody>
        ${membersArray.map(member => `
          <tr style="${!member.isSimulated ? 'background-color: #e3f2fd; font-weight: bold;' : ''}">
            <td>${member.isSimulated ? member.participantId.substring(0, 20) + '...' : 'You (Focal User)'}</td>
            <td>${member.isSimulated ? 'Simulated' : 'Real Participant'}</td>
            <td>${member.totalContribution}</td>
            <td>${member.rounds}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    container.appendChild(table);
    
  } catch (error) {
    console.error('Error loading team members:', error);
    document.getElementById('teamMembersContainer').innerHTML = 
      '<p style="color: #e74c3c;">Error loading team members.</p>';
  }
}

async function loadParticipantRounds(participantId) {
  try {
    const selectedRound = document.getElementById('participantRoundFilter').value;
    
    // Get all rounds for this participant
    let query = db.collection('payoffs')
      .where('participantId', '==', participantId)
      .orderBy('round');
    
    if (selectedRound !== 'all') {
      query = query.where('round', '==', parseInt(selectedRound));
    }
    
    const payoffsSnapshot = await query.get();
    const tbody = document.getElementById('participantRoundsTableBody');
    tbody.innerHTML = '';
    
    // Update round filter options
    if (selectedRound === 'all') {
      const allRoundsSnapshot = await db.collection('payoffs')
        .where('participantId', '==', participantId)
        .orderBy('round')
        .get();
      
      const rounds = new Set();
      allRoundsSnapshot.forEach(doc => {
        rounds.add(doc.data().round);
      });
      
      const roundFilter = document.getElementById('participantRoundFilter');
      const currentValue = roundFilter.value;
      roundFilter.innerHTML = '<option value="all">All Rounds</option>';
      
      Array.from(rounds).sort((a, b) => a - b).forEach(round => {
        const option = document.createElement('option');
        option.value = round;
        option.textContent = `Round ${round}`;
        roundFilter.appendChild(option);
      });
      
      roundFilter.value = currentValue;
    }
    
    // Display rounds
    payoffsSnapshot.forEach(doc => {
      const data = doc.data();
      const row = tbody.insertRow();
      
      row.insertCell(0).textContent = data.round || 'N/A';
      row.insertCell(1).textContent = data.contribution || 0;
      row.insertCell(2).textContent = data.groupTotal || 0;
      row.insertCell(3).textContent = (data.groupShare || 0).toFixed(2);
      row.insertCell(4).textContent = data.kept || 0;
      row.insertCell(5).textContent = (data.payoff || 0).toFixed(2);
      row.insertCell(6).textContent = (data.cumulativePayoff || 0).toFixed(2);
      
      // Treatment conditions
      const treatments = data.treatmentConditions || {};
      const treatmentText = treatments.infoType 
        ? `Cell ${treatments.betweenSubjectCell || 'N/A'}: ${treatments.infoType} | Team: ${treatments.teamContribution || 'N/A'} | Ind LB: ${treatments.individualLBStability || 'N/A'} | Team LB: ${treatments.teamLBStability || 'N/A'}`
        : 'N/A';
      row.insertCell(7).textContent = treatmentText;
      row.insertCell(7).style.fontSize = '11px';
    });
    
    if (payoffsSnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666;">No rounds found for this participant.</td></tr>';
    }
    
  } catch (error) {
    console.error('Error loading participant rounds:', error);
    document.getElementById('participantRoundsTableBody').innerHTML = 
      '<tr><td colspan="8" style="text-align: center; color: #e74c3c;">Error loading rounds.</td></tr>';
  }
}

async function loadGroups() {
  try {
    const groupsSnapshot = await db.collection('groups').get();
    const container = document.getElementById('groupsContainer');
    container.innerHTML = '';
    
    groupsSnapshot.forEach(doc => {
      const data = doc.data();
      const groupCard = document.createElement('div');
      groupCard.className = 'group-card';
      
      groupCard.innerHTML = `
        <h3>Group ${doc.id.substring(0, 8)}</h3>
        <p><strong>Members:</strong> ${data.memberCount || 0} / ${data.memberCount || 0}</p>
        <p><strong>Status:</strong> ${data.status || 'unknown'}</p>
        <div class="group-members">
          ${(data.members || []).map(m => `<div class="group-member">${m}</div>`).join('')}
        </div>
      `;
      
      container.appendChild(groupCard);
    });
    
  } catch (error) {
    console.error('Error loading groups:', error);
  }
}

async function loadRoundData() {
  const selectedRound = document.getElementById('roundSelector').value;
  
  try {
    let query = db.collection('contributions').orderBy('round').orderBy('timestamp');
    
    if (selectedRound !== 'all') {
      query = query.where('round', '==', parseInt(selectedRound));
    }
    
    const snapshot = await query.get();
    const tbody = document.getElementById('roundsTableBody');
    tbody.innerHTML = '';
    
    // Update round selector options
    const rounds = new Set();
    snapshot.forEach(doc => {
      rounds.add(doc.data().round);
    });
    
    const roundSelector = document.getElementById('roundSelector');
    const currentValue = roundSelector.value;
    roundSelector.innerHTML = '<option value="all">All Rounds</option>';
    
    Array.from(rounds).sort((a, b) => a - b).forEach(round => {
      const option = document.createElement('option');
      option.value = round;
      option.textContent = `Round ${round}`;
      roundSelector.appendChild(option);
    });
    
    roundSelector.value = currentValue;
    
    // Load payoffs for display
    const payoffsSnapshot = await db.collection('payoffs').get();
    const payoffsMap = new Map();
    payoffsSnapshot.forEach(doc => {
      const data = doc.data();
      const key = `${data.participantId}_${data.round}`;
      payoffsMap.set(key, data);
    });
    
    // Display contributions - use for...of loop to allow await
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const row = tbody.insertRow();
      
      row.insertCell(0).textContent = data.round || 'N/A';
      row.insertCell(1).textContent = data.participantId || 'N/A';
      row.insertCell(2).textContent = data.groupId ? `Group ${data.groupId.substring(0, 8)}` : 'N/A';
      row.insertCell(3).textContent = data.contribution || 0;
      
      // Get group total for this round
      const groupTotal = await getGroupTotalForRound(data.groupId, data.round);
      row.insertCell(4).textContent = groupTotal;
      
      // Get payoff
      const payoffKey = `${data.participantId}_${data.round}`;
      const payoff = payoffsMap.get(payoffKey);
      row.insertCell(5).textContent = payoff ? payoff.payoff.toFixed(2) : 'N/A';
      
      // Timestamp
      const timestamp = data.timestamp ? data.timestamp.toDate() : new Date(data.submittedAt);
      row.insertCell(6).textContent = timestamp.toLocaleString();
    }
    
  } catch (error) {
    console.error('Error loading round data:', error);
  }
}

async function getGroupTotalForRound(groupId, round) {
  try {
    const snapshot = await db.collection('contributions')
      .where('groupId', '==', groupId)
      .where('round', '==', round)
      .get();
    
    let total = 0;
    snapshot.forEach(doc => {
      total += doc.data().contribution || 0;
    });
    
    return total;
  } catch (error) {
    console.error('Error getting group total:', error);
    return 0;
  }
}

async function loadTreatmentDistribution() {
  try {
    const participantsSnapshot = await db.collection('participants').get();
    
    let teamLB = 0;
    let indLB = 0;
    let comp = 0;
    
    participantsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.showTeamLeaderboard) teamLB++;
      if (data.showIndividualLeaderboard) indLB++;
      if (data.showContributionComparison) comp++;
    });
    
    document.getElementById('treatmentTeamLeaderboard').textContent = teamLB;
    document.getElementById('treatmentIndividualLeaderboard').textContent = indLB;
    document.getElementById('treatmentContributionComparison').textContent = comp;
    
  } catch (error) {
    console.error('Error loading treatment distribution:', error);
  }
}

function viewParticipantDetails(participantId) {
  // Open a new window or modal with detailed participant information
  alert(`Participant Details for ${participantId}\n\nThis feature can be expanded to show detailed round-by-round data.`);
}

async function exportToExcel() {
  try {
    // Get all data
    const [participantsSnapshot, contributionsSnapshot, payoffsSnapshot] = await Promise.all([
      db.collection('participants').get(),
      db.collection('contributions').get(),
      db.collection('payoffs').get()
    ]);
    
    // Convert to CSV format
    let csv = 'Participant ID,Group ID,Round,Contribution,Group Total,Payoff,Cumulative Payoff,Info Timing,Focal Condition,LB Stability,Social Norm,Team Rank,Team Rank Stability,Team LB,Ind LB Team,Ind LB All\n';
    
    const participantsMap = new Map();
    participantsSnapshot.forEach(doc => {
      participantsMap.set(doc.data().participantId, doc.data());
    });
    
    const payoffsMap = new Map();
    payoffsSnapshot.forEach(doc => {
      const data = doc.data();
      payoffsMap.set(`${data.participantId}_${data.round}`, data);
    });
    
    // Get all group totals first
    const groupTotalsMap = new Map();
    const uniqueRounds = new Set();
    contributionsSnapshot.forEach(doc => {
      const data = doc.data();
      uniqueRounds.add(data.round);
      const key = `${data.groupId}_${data.round}`;
      if (!groupTotalsMap.has(key)) {
        groupTotalsMap.set(key, null); // Will be calculated
      }
    });
    
    // Calculate group totals
    // Use for...of to allow await
    const groupTotalsEntries = Array.from(groupTotalsMap.entries());
    for (const [key, _] of groupTotalsEntries) {
      const [groupId, round] = key.split('_');
      const total = await getGroupTotalForRound(groupId, parseInt(round));
      groupTotalsMap.set(key, total);
    }
    
    contributionsSnapshot.forEach(doc => {
      const data = doc.data();
      const participant = participantsMap.get(data.participantId);
      const payoffKey = `${data.participantId}_${data.round}`;
      const payoff = payoffsMap.get(payoffKey);
      
      // Get treatment conditions from contribution record (most accurate)
      const treatments = data.treatmentConditions || participant?.experimentConfig || {};
      
      const groupTotalKey = `${data.groupId}_${data.round}`;
      const groupTotal = groupTotalsMap.get(groupTotalKey) || 0;
      
      // Extract treatment values for CSV columns
      const infoTiming = treatments?.infoDisplayTiming || 'N/A';
      const focalCond = treatments?.focalUserCondition || 'N/A';
      const lbStability = treatments?.leaderboardStability || 'N/A';
      const socialNorm = treatments?.socialNormDisplay || 'N/A';
      const teamRank = treatments?.focalMemberTeamRank || 'N/A';
      const teamRankStability = treatments?.teamLeaderboardRankingStability || 'N/A';
      const teamLB = treatments?.showTeamLeaderboard ? 'Y' : 'N';
      const indLBTeam = treatments?.showIndividualLeaderboardWithinTeam ? 'Y' : 'N';
      const indLBAll = treatments?.showIndividualLeaderboardAcrossTeams ? 'Y' : 'N';
      
      csv += `${data.participantId},${data.groupId},${data.round},${data.contribution},${groupTotal},${payoff?.payoff || 'N/A'},${participant?.cumulativePayoff || 0},${infoTiming},${focalCond},${lbStability},${socialNorm},${teamRank},${teamRankStability},${teamLB},${indLBTeam},${indLBAll}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freeriding_experiment_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
    
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data. Please try again.');
  }
}

function confirmReset() {
  if (confirm('Are you sure you want to reset the experiment? This will delete all data and cannot be undone!')) {
    if (confirm('This is your final warning. All data will be permanently deleted. Continue?')) {
      resetExperiment();
    }
  }
}

async function resetExperiment() {
  try {
    // Delete all collections
    const collections = ['participants', 'contributions', 'payoffs', 'groups', 'rounds'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    }
    
    alert('Experiment reset successfully!');
    loadDashboardData();
    
  } catch (error) {
    console.error('Error resetting experiment:', error);
    alert('Error resetting experiment. Please try again.');
  }
}

function setupRealtimeListeners() {
  // Real-time updates for participants
  db.collection('participants').onSnapshot(() => {
    loadStatistics();
    loadParticipants();
    loadTreatmentDistribution();
  });
  
  // Real-time updates for contributions
  db.collection('contributions').onSnapshot(() => {
    loadStatistics();
    loadRoundData();
  });
  
  // Real-time updates for groups
  db.collection('groups').onSnapshot(() => {
    loadGroups();
  });
}

