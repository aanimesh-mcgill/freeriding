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

// Between-subject cells (14 cells)
const BETWEEN_SUBJECT_CELLS = [
  { infoType: 'noInfo', focalUserContributionLevel: 'lower' }, // Cell 1
  { infoType: 'noInfo', focalUserContributionLevel: 'higher' }, // Cell 2
  { infoType: 'teamLB', focalUserContributionLevel: 'lower' }, // Cell 3
  { infoType: 'teamLB', focalUserContributionLevel: 'higher' }, // Cell 4
  { infoType: 'indLBWithin', focalUserContributionLevel: 'lower' }, // Cell 5
  { infoType: 'indLBWithin', focalUserContributionLevel: 'higher' }, // Cell 6
  { infoType: 'bothLBWithin', focalUserContributionLevel: 'lower' }, // Cell 7
  { infoType: 'bothLBWithin', focalUserContributionLevel: 'higher' }, // Cell 8
  { infoType: 'bothLBAcross', focalUserContributionLevel: 'lower' }, // Cell 9
  { infoType: 'bothLBAcross', focalUserContributionLevel: 'higher' }, // Cell 10
  { infoType: 'socialNorm', focalUserContributionLevel: 'lower' }, // Cell 11
  { infoType: 'socialNorm', focalUserContributionLevel: 'higher' }, // Cell 12
  { infoType: 'indLBAcross', focalUserContributionLevel: 'lower' }, // Cell 13
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

// Generate randomized sequence of within-subject factors
function generateWithinSubjectSequence(totalRounds) {
  const combinations = generateWithinSubjectCombinations();
  const sequence = [];
  
  // Repeat combinations to fill all rounds, then shuffle
  while (sequence.length < totalRounds) {
    sequence.push(...combinations);
  }
  
  // Shuffle and take first totalRounds
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  
  return sequence.slice(0, totalRounds);
}

// Generate unique participant ID
function generateUniqueId() {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UID-${timestamp}-${randomStr}`;
}

// Generate contribution based on treatment conditions and previous actions
function generateContribution(round, previousContribution, previousPayoff, previousGroupTotal, 
                             infoType, focalUserLevel, teamContribution, roundNumber, totalRounds) {
  // Base contribution (moderate, around 10 tokens)
  let contribution = 10;
  
  // Treatment effects
  // Leaderboards increase contributions (social comparison, competition)
  if (infoType === 'teamLB' || infoType === 'indLBWithin' || infoType === 'bothLBWithin' || 
      infoType === 'bothLBAcross' || infoType === 'indLBAcross') {
    contribution += 2 + Math.random() * 3; // +2 to +5 tokens
  }
  
  // Social norm increases contributions (conformity)
  if (infoType === 'socialNorm') {
    if (teamContribution === 'high') {
      contribution = 14 + (Math.random() - 0.5) * 4; // Target around 14 (close to 16)
    } else {
      contribution = 6 + (Math.random() - 0.5) * 4; // Target around 6
    }
  }
  
  // Focal user level effect (if higher condition, contribute more; if lower, contribute less)
  if (focalUserLevel === 'higher') {
    contribution += 1 + Math.random() * 2; // +1 to +3 tokens
  } else {
    contribution -= 1 + Math.random() * 2; // -1 to -3 tokens
  }
  
  // Team contribution effect (if team is high, contribute more; if low, contribute less)
  if (teamContribution === 'high') {
    contribution += 1 + Math.random() * 1.5; // +1 to +2.5 tokens
  } else {
    contribution -= 1 + Math.random() * 1.5; // -1 to -2.5 tokens
  }
  
  // Lagged dependent variable effect (habit formation)
  if (previousContribution > 0) {
    contribution = 0.3 * previousContribution + 0.7 * contribution; // 30% persistence
  }
  
  // Previous payoff effect (reinforcement learning)
  if (previousPayoff > 0) {
    const payoffEffect = (previousPayoff - 10) / 10; // Normalize around 10
    contribution += payoffEffect * 0.5; // Small effect
  }
  
  // Previous group total effect (conditional cooperation)
  if (previousGroupTotal > 0) {
    const groupEffect = (previousGroupTotal - 60) / 60; // Normalize around 60 (6 members × 10 avg)
    contribution += groupEffect * 2; // Moderate effect
  }
  
  // Round number effect (learning/decline over time)
  const roundEffect = -0.2 * (roundNumber - 1); // Slight decline over rounds
  contribution += roundEffect;
  
  // Add random noise
  contribution += (Math.random() - 0.5) * 3; // ±1.5 tokens noise
  
  // Ensure contribution is within bounds [0, 20]
  contribution = Math.max(0, Math.min(20, Math.round(contribution)));
  
  return contribution;
}

// Generate synthetic participant data
async function generateSyntheticParticipant(cellNumber, participantIndex, totalRounds, groupSize, totalTeams) {
  const cell = BETWEEN_SUBJECT_CELLS[cellNumber - 1];
  const participantId = `SYNTH_${cellNumber}_${participantIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const uniqueParticipantId = generateUniqueId();
  
  // Generate within-subject sequence
  const withinSubjectSequence = generateWithinSubjectSequence(totalRounds);
  
  // Create 10 teams for this participant
  const allTeamIds = [];
  let userTeamId = null;
  
  for (let teamNum = 1; teamNum <= totalTeams; teamNum++) {
    const newGroupRef = db.collection('groups').doc();
    const teamId = newGroupRef.id;
    allTeamIds.push(teamId);
    
    if (teamNum === 5) {
      userTeamId = teamId;
      await newGroupRef.set({
        groupId: teamId,
        members: [participantId],
        memberCount: 1,
        status: 'active',
        participantId: participantId,
        teamNumber: 5,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await newGroupRef.set({
        groupId: teamId,
        members: [],
        memberCount: 0,
        status: 'active',
        participantId: participantId,
        teamNumber: teamNum,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  
  // Create participant record
  const experimentConfig = {
    betweenSubjectCell: cellNumber,
    infoType: cell.infoType,
    focalUserContributionLevel: cell.focalUserContributionLevel,
    withinSubjectSequence: withinSubjectSequence,
    simulatedTeamSize: groupSize - 1,
    totalTeams: totalTeams
  };
  
  await db.collection('participants').doc(participantId).set({
    participantId,
    uniqueParticipantId,
    groupId: userTeamId,
    currentRound: totalRounds + 1, // Completed all rounds
    totalContribution: 0, // Will be calculated
    cumulativePayoff: 0, // Will be calculated
    experimentConfig: experimentConfig,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'completed',
    isSynthetic: true
  });
  
  // Generate contributions for all rounds
  let totalContribution = 0;
  let cumulativePayoff = 0;
  const contributions = [];
  const payoffs = [];
  
  for (let round = 1; round <= totalRounds; round++) {
    const withinSubject = withinSubjectSequence[round - 1];
    
    // Get previous round data
    const previousRound = round > 1 ? contributions[round - 2] : null;
    const previousContribution = previousRound ? previousRound.contribution : 0;
    const previousPayoff = previousRound ? previousRound.payoff : 0;
    const previousGroupTotal = previousRound ? previousRound.groupTotal : 0;
    
    // Generate contribution
    const contribution = generateContribution(
      round,
      previousContribution,
      previousPayoff,
      previousGroupTotal,
      cell.infoType,
      cell.focalUserContributionLevel,
      withinSubject.teamContribution,
      round,
      totalRounds
    );
    
    totalContribution += contribution;
    
    // Generate simulated team member contributions (5 members)
    const simulatedContributions = [];
    let groupTotal = contribution;
    
    for (let i = 1; i <= groupSize - 1; i++) {
      // Simulated members contribute moderately, with some variation
      let simContrib = 8 + Math.random() * 8; // 8-16 tokens
      
      // Adjust based on focal user condition (to maintain top/bottom 3 position)
      if (cell.focalUserContributionLevel === 'higher') {
        // Focal user should be in top 3, so simulated members contribute less
        simContrib = Math.min(simContrib, contribution - 1 + Math.random() * 3);
      } else {
        // Focal user should be in bottom 3, so simulated members contribute more
        simContrib = Math.max(simContrib, contribution + 1 + Math.random() * 3);
      }
      
      simContrib = Math.max(0, Math.min(20, Math.round(simContrib)));
      simulatedContributions.push({
        memberId: `SIM_${userTeamId}_${i}`,
        contribution: simContrib
      });
      groupTotal += simContrib;
    }
    
    // Save simulated contributions
    await db.collection('simulatedContributions').doc(`${userTeamId}_${round}`).set({
      groupId: userTeamId,
      round: round,
      contributions: simulatedContributions,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Save focal user contribution
    const contributionRef = await db.collection('contributions').add({
      participantId,
      groupId: userTeamId,
      round: round,
      contribution: contribution,
      endowment: 20,
      treatmentConditions: {
        betweenSubjectCell: cellNumber,
        infoType: cell.infoType,
        focalUserContributionLevel: cell.focalUserContributionLevel,
        teamContribution: withinSubject.teamContribution,
        individualLBStability: withinSubject.individualLBStability,
        teamLBStability: withinSubject.teamLBStability,
        round: round
      },
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      submittedAt: Date.now()
    });
    
    // Save simulated member contributions
    for (const simContrib of simulatedContributions) {
      await db.collection('contributions').add({
        participantId: simContrib.memberId,
        groupId: userTeamId,
        round: round,
        contribution: simContrib.contribution,
        endowment: 20,
        isSimulated: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        submittedAt: Date.now()
      });
    }
    
    // Calculate payoff (MPCR = 0.4, so group share per person = (groupTotal * 0.4) / groupSize)
    const multiplier = 0.4; // MPCR
    const groupShare = (groupTotal * multiplier) / groupSize;
    const kept = 20 - contribution;
    const payoff = kept + groupShare;
    cumulativePayoff += payoff;
    
    // Save payoff
    await db.collection('payoffs').add({
      participantId,
      groupId: userTeamId,
      round: round,
      contribution: contribution,
      groupTotal: groupTotal,
      groupShare: groupShare,
      kept: kept,
      payoff: payoff,
      cumulativePayoff: cumulativePayoff,
      treatmentConditions: {
        betweenSubjectCell: cellNumber,
        infoType: cell.infoType,
        focalUserContributionLevel: cell.focalUserContributionLevel,
        teamContribution: withinSubject.teamContribution,
        individualLBStability: withinSubject.individualLBStability,
        teamLBStability: withinSubject.teamLBStability,
        round: round
      },
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark round as completed
    await db.collection('rounds').doc(`${participantId}_${round}`).set({
      participantId,
      groupId: userTeamId,
      round: round,
      completed: true,
      completedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    contributions.push({
      round,
      contribution,
      groupTotal,
      payoff
    });
  }
  
  // Update participant with final totals
  await db.collection('participants').doc(participantId).update({
    totalContribution: totalContribution,
    cumulativePayoff: cumulativePayoff
  });
  
  return {
    participantId,
    cellNumber,
    totalContribution,
    cumulativePayoff
  };
}

// Main generation function
let isGenerating = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generateBtn').addEventListener('click', startGeneration);
  document.getElementById('clearLogBtn').addEventListener('click', () => {
    document.getElementById('statusLog').innerHTML = '';
  });
});

function log(message, type = 'info') {
  const logEl = document.getElementById('statusLog');
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  console.log(message);
}

function updateProgress(current, total) {
  const percentage = Math.round((current / total) * 100);
  document.getElementById('progressFill').style.width = `${percentage}%`;
  document.getElementById('progressFill').textContent = `${percentage}%`;
  document.getElementById('progressText').textContent = `Generated ${current} of ${total} participants`;
}

async function startGeneration() {
  if (isGenerating) {
    alert('Generation already in progress. Please wait.');
    return;
  }
  
  const confirmed = confirm(
    'This will generate 420 synthetic participants (30 per cell × 14 cells). ' +
    'This may take several minutes. Continue?'
  );
  
  if (!confirmed) return;
  
  isGenerating = true;
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('statusLog').innerHTML = '';
  
  try {
    // Get experiment settings
    const settingsDoc = await db.collection('settings').doc('experiment').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    const totalRounds = settings.totalRounds || 10;
    const groupSize = settings.groupSize || 6;
    const totalTeams = settings.totalTeams || 10;
    
    log(`Starting generation: ${totalRounds} rounds, ${groupSize} members per group, ${totalTeams} teams`, 'info');
    
    const totalParticipants = 14 * 30; // 14 cells × 30 participants
    let generated = 0;
    
    // Generate for each cell
    for (let cellNum = 1; cellNum <= 14; cellNum++) {
      log(`Generating Cell ${cellNum} (${BETWEEN_SUBJECT_CELLS[cellNum - 1].infoType}, ${BETWEEN_SUBJECT_CELLS[cellNum - 1].focalUserContributionLevel})...`, 'info');
      
      // Generate 30 participants for this cell
      for (let pIndex = 1; pIndex <= 30; pIndex++) {
        try {
          const result = await generateSyntheticParticipant(
            cellNum,
            pIndex,
            totalRounds,
            groupSize,
            totalTeams
          );
          generated++;
          updateProgress(generated, totalParticipants);
          
          if (pIndex % 5 === 0) {
            log(`  Cell ${cellNum}: Generated ${pIndex}/30 participants`, 'success');
          }
        } catch (error) {
          log(`  Error generating participant ${pIndex} in cell ${cellNum}: ${error.message}`, 'error');
        }
      }
      
      log(`Cell ${cellNum} complete: 30 participants generated`, 'success');
    }
    
    log(`\n=== GENERATION COMPLETE ===`, 'success');
    log(`Total participants generated: ${generated}`, 'success');
    log(`You can now run the statistical analysis to test the empirical model.`, 'info');
    
    alert(`Generation complete! ${generated} synthetic participants created.`);
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error('Generation error:', error);
    alert('Error during generation. Check the log for details.');
  } finally {
    isGenerating = false;
    document.getElementById('generateBtn').disabled = false;
  }
}

