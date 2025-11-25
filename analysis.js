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

// Simple OLS Regression Implementation
class SimpleRegression {
  constructor() {
    this.X = [];
    this.y = [];
    this.coefficients = [];
    this.residuals = [];
    this.rSquared = 0;
    this.adjRSquared = 0;
    this.standardErrors = [];
    this.tStats = [];
    this.pValues = [];
  }
  
  addData(x, y) {
    this.X.push(x);
    this.y.push(y);
  }
  
  fit() {
    if (this.X.length === 0 || this.y.length === 0) {
      throw new Error('No data to fit');
    }
    
    const n = this.X.length;
    const k = this.X[0].length; // Number of predictors (including intercept)
    
    // Convert to matrix format
    const XMatrix = mlMatrix.Matrix.from1DArray(n, k, this.X.flat());
    const yMatrix = mlMatrix.Matrix.from1DArray(n, 1, this.y);
    
    // Calculate coefficients: (X'X)^(-1)X'y
    const Xt = XMatrix.transpose();
    const XtX = Xt.mmul(XMatrix);
    const XtXInv = XtX.inverse();
    const Xty = Xt.mmul(yMatrix);
    this.coefficients = XtXInv.mmul(Xty).to1DArray();
    
    // Calculate predictions
    const yPred = XMatrix.mmul(mlMatrix.Matrix.from1DArray(k, 1, this.coefficients));
    const yPredArray = yPred.to1DArray();
    
    // Calculate residuals
    this.residuals = this.y.map((yi, i) => yi - yPredArray[i]);
    
    // Calculate R-squared
    const yMean = this.y.reduce((a, b) => a + b, 0) / n;
    const ssRes = this.residuals.reduce((sum, r) => sum + r * r, 0);
    const ssTot = this.y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    this.rSquared = 1 - (ssRes / ssTot);
    this.adjRSquared = 1 - ((1 - this.rSquared) * (n - 1) / (n - k));
    
    // Calculate standard errors
    const mse = ssRes / (n - k);
    const varCov = XtXInv.mul(mse);
    this.standardErrors = [];
    for (let i = 0; i < k; i++) {
      this.standardErrors.push(Math.sqrt(varCov.get(i, i)));
    }
    
    // Calculate t-statistics and p-values
    this.tStats = this.coefficients.map((coef, i) => coef / this.standardErrors[i]);
    this.pValues = this.tStats.map(t => {
      // Two-tailed t-test p-value approximation
      const df = n - k;
      const absT = Math.abs(t);
      // Simplified p-value calculation (for df > 30, use normal approximation)
      if (df > 30) {
        // Normal approximation: p = 2 * (1 - normcdf(|t|))
        // Using approximation: normcdf(x) ≈ 1 - 0.5 * (1 + erf(x/√2))
        const z = absT;
        const p = 2 * (1 - 0.5 * (1 + this.erf(z / Math.sqrt(2))));
        return p;
      } else {
        // For smaller df, use t-distribution approximation
        const p = 2 * (1 - this.tCDF(absT, df));
        return p;
      }
    });
  }
  
  // Error function approximation
  erf(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
  
  // t-distribution CDF approximation
  tCDF(t, df) {
    if (df <= 0) return 0.5;
    const x = df / (df + t * t);
    // Incomplete beta function approximation
    return 0.5 * (1 + Math.sign(t) * (1 - this.incompleteBeta(x, df / 2, 0.5)));
  }
  
  // Incomplete beta function approximation
  incompleteBeta(x, a, b) {
    if (x === 0) return 0;
    if (x === 1) return 1;
    // Simplified approximation
    return Math.pow(x, a) * Math.pow(1 - x, b) / (a * this.beta(a, b));
  }
  
  beta(a, b) {
    return this.gamma(a) * this.gamma(b) / this.gamma(a + b);
  }
  
  gamma(z) {
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
    }
    z -= 1;
    let x = 0.99999999999980993;
    const coefficients = [
      676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012,
      9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    for (let i = 0; i < coefficients.length; i++) {
      x += coefficients[i] / (z + i + 1);
    }
    const t = z + coefficients.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  
  getResults() {
    return {
      coefficients: this.coefficients,
      standardErrors: this.standardErrors,
      tStats: this.tStats,
      pValues: this.pValues,
      rSquared: this.rSquared,
      adjRSquared: this.adjRSquared,
      n: this.X.length
    };
  }
}

let currentRegressionData = null; // Store regression data for download

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('runAnalysisBtn').addEventListener('click', runStatisticalAnalysis);
  document.getElementById('downloadDatasetBtn').addEventListener('click', downloadDataset);
});

async function runStatisticalAnalysis() {
  const loadingSection = document.getElementById('loadingSection');
  const resultsSection = document.getElementById('analysisResults');
  const resultsContent = document.getElementById('resultsContent');
  
  loadingSection.style.display = 'block';
  resultsSection.style.display = 'none';
  resultsContent.innerHTML = '';
  
  try {
    // Fetch all data
    console.log('Fetching data...');
    const [participantsSnapshot, contributionsSnapshot, payoffsSnapshot] = await Promise.all([
      db.collection('participants').get(),
      db.collection('contributions').get(),
      db.collection('payoffs').get()
    ]);
    
    console.log(`Loaded ${participantsSnapshot.size} participants, ${contributionsSnapshot.size} contributions, ${payoffsSnapshot.size} payoffs`);
    
    // Build data structure: participant -> rounds -> data
    const participantData = new Map();
    
    participantsSnapshot.forEach(doc => {
      const data = doc.data();
      participantData.set(data.participantId, {
        participantId: data.participantId,
        experimentConfig: data.experimentConfig || {},
        rounds: new Map()
      });
    });
    
    // Add contributions
    contributionsSnapshot.forEach(doc => {
      const data = doc.data();
      // Only include real participants (not simulated)
      if (!data.isSimulated && data.participantId && !data.participantId.startsWith('SIM_')) {
        const participant = participantData.get(data.participantId);
        if (participant) {
          if (!participant.rounds.has(data.round)) {
            participant.rounds.set(data.round, {
              round: data.round,
              contribution: data.contribution,
              groupId: data.groupId,
              treatmentConditions: data.treatmentConditions || {}
            });
          }
        }
      }
    });
    
    // Add payoffs and group totals
    payoffsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.participantId.startsWith('SIM_')) {
        const participant = participantData.get(data.participantId);
        if (participant) {
          const roundData = participant.rounds.get(data.round);
          if (roundData) {
            roundData.payoff = data.payoff || 0;
            roundData.groupTotal = data.groupTotal || 0;
            roundData.groupShare = data.groupShare || 0;
          }
        }
      }
    });
    
    // Prepare regression data
    const regressionData = [];
    const variableNames = ['Intercept'];
    
    participantData.forEach(participant => {
      const rounds = Array.from(participant.rounds.values()).sort((a, b) => a.round - b.round);
      
      rounds.forEach((roundData, index) => {
        // Skip first round (no previous round data)
        if (index === 0) return;
        
        const prevRoundData = rounds[index - 1];
        const currentContribution = roundData.contribution;
        
        // Build feature vector - initialize variable names only once
        if (variableNames.length === 1) {
          // Previous round controls
          variableNames.push('Previous Contribution');
          variableNames.push('Previous Payoff');
          variableNames.push('Previous Group Total');
          variableNames.push('Round Number');
          
          // Info Type dummy variables (noInfo is reference category)
          const infoTypes = ['noInfo', 'teamLB', 'indLBWithin', 'bothLBWithin', 'bothLBAcross', 'socialNorm', 'indLBAcross'];
          for (let idx = 1; idx < infoTypes.length; idx++) {
            variableNames.push(`Info: ${infoTypes[idx]}`);
          }
          
          // Other treatment variables
          variableNames.push('Focal User: Higher (vs Lower)');
          variableNames.push('Team Contribution: High (vs Low)');
          variableNames.push('Ind LB Stability: High (vs Low)');
          variableNames.push('Team LB Stability: High (vs Low)');
        }
        
        const features = [1]; // Intercept
        
        // Previous round controls
        features.push(prevRoundData.contribution || 0); // Lagged contribution
        features.push(prevRoundData.payoff || 0); // Previous payoff
        features.push(prevRoundData.groupTotal || 0); // Previous group total
        features.push(roundData.round); // Round number
        
        // Treatment conditions (dummy variables)
        const treatments = roundData.treatmentConditions || participant.experimentConfig || {};
        
        // Info Type (7 levels: noInfo, teamLB, indLBWithin, bothLBWithin, bothLBAcross, socialNorm, indLBAcross)
        const infoType = treatments.infoType || 'noInfo';
        const infoTypes = ['noInfo', 'teamLB', 'indLBWithin', 'bothLBWithin', 'bothLBAcross', 'socialNorm', 'indLBAcross'];
        for (let idx = 1; idx < infoTypes.length; idx++) {
          features.push(infoType === infoTypes[idx] ? 1 : 0);
        }
        
        // Focal User Contribution Level (2 levels: lower, higher)
        features.push(treatments.focalUserContributionLevel === 'higher' ? 1 : 0);
        
        // Team Contribution (2 levels: high, low)
        features.push(treatments.teamContribution === 'high' ? 1 : 0);
        
        // Individual LB Stability (2 levels: high, low)
        features.push(treatments.individualLBStability === 'high' ? 1 : 0);
        
        // Team LB Stability (2 levels: high, low)
        features.push(treatments.teamLBStability === 'high' ? 1 : 0);
        
        regressionData.push({
          features: features,
          contribution: currentContribution,
          participantId: participant.participantId,
          round: roundData.round
        });
      });
    });
    
    if (regressionData.length === 0) {
      throw new Error('No data available for analysis. Need at least 2 rounds of data per participant.');
    }
    
    console.log(`Prepared ${regressionData.length} observations for regression`);
    console.log(`Number of variables: ${variableNames.length}`);
    
    // Store regression data for download
    currentRegressionData = regressionData;
    
    // Run regression
    console.log('Running regression...');
    const regression = new SimpleRegression();
    
    regressionData.forEach(d => {
      regression.addData(d.features, d.contribution);
    });
    
    regression.fit();
    const results = regression.getResults();
    
    // Display results
    displayResults(results, variableNames, regressionData.length);
    
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
  } catch (error) {
    console.error('Error running analysis:', error);
    loadingSection.style.display = 'none';
    resultsContent.innerHTML = `
      <div class="error-message">
        <strong>Error:</strong> ${error.message}
        <br><br>
        Please ensure you have at least some participants who have completed 2 or more rounds.
      </div>
    `;
    resultsSection.style.display = 'block';
  }
}

function displayResults(results, variableNames, n) {
  const resultsContent = document.getElementById('resultsContent');
  
  let html = `
    <div class="model-summary">
      <div class="model-summary-item">
        <span class="model-summary-label">Observations (N):</span>
        <span>${n}</span>
      </div>
      <div class="model-summary-item">
        <span class="model-summary-label">R-squared:</span>
        <span>${(results.rSquared * 100).toFixed(2)}%</span>
      </div>
      <div class="model-summary-item">
        <span class="model-summary-label">Adjusted R-squared:</span>
        <span>${(results.adjRSquared * 100).toFixed(2)}%</span>
      </div>
    </div>
    
    <div class="model-results">
      <table class="results-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Coefficient</th>
            <th>Std. Error</th>
            <th>t-statistic</th>
            <th>p-value</th>
            <th>Significance</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  results.coefficients.forEach((coef, i) => {
    const se = results.standardErrors[i];
    const tStat = results.tStats[i];
    const pVal = results.pValues[i];
    
    let significance = '';
    let pValueClass = '';
    if (pVal < 0.01) {
      significance = '***';
      pValueClass = 'p-value-significant';
    } else if (pVal < 0.05) {
      significance = '**';
      pValueClass = 'p-value-significant';
    } else if (pVal < 0.10) {
      significance = '*';
      pValueClass = 'p-value-marginal';
    }
    
    const coefClass = coef >= 0 ? 'coefficient-positive' : 'coefficient-negative';
    
    html += `
      <tr>
        <td><strong>${variableNames[i] || `Variable ${i + 1}`}</strong></td>
        <td class="${coefClass}">${coef.toFixed(4)}</td>
        <td>${se.toFixed(4)}</td>
        <td>${tStat.toFixed(4)}</td>
        <td class="${pValueClass}">${pVal.toFixed(4)}</td>
        <td><strong>${significance}</strong></td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
    
    <div class="info-box" style="margin-top: 20px;">
      <strong>Interpretation:</strong>
      <ul style="margin: 10px 0 0 20px;">
        <li><strong>***</strong> p &lt; 0.01 (highly significant)</li>
        <li><strong>**</strong> p &lt; 0.05 (significant)</li>
        <li><strong>*</strong> p &lt; 0.10 (marginally significant)</li>
      </ul>
      <p style="margin-top: 10px;">
        <strong>Note:</strong> Coefficients represent the change in contribution (tokens) associated with a one-unit change in the predictor variable, 
        holding all other variables constant. Positive coefficients indicate higher contributions, negative coefficients indicate lower contributions.
      </p>
    </div>
  `;
  
  resultsContent.innerHTML = html;
}

function downloadDataset() {
  if (!currentRegressionData || currentRegressionData.length === 0) {
    alert('Please run the analysis first to generate the dataset.');
    return;
  }
  
  // Build CSV header
  const headers = [
    'Participant ID',
    'Round',
    'Contribution',
    'Previous Contribution',
    'Previous Payoff',
    'Previous Group Total',
    'Round Number',
    'Info Type: teamLB',
    'Info Type: indLBWithin',
    'Info Type: bothLBWithin',
    'Info Type: bothLBAcross',
    'Info Type: socialNorm',
    'Info Type: indLBAcross',
    'Focal User: Higher',
    'Team Contribution: High',
    'Ind LB Stability: High',
    'Team LB Stability: High'
  ];
  
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  currentRegressionData.forEach(row => {
    const csvRow = [
      row.participantId,
      row.round,
      row.contribution,
      ...row.features.slice(1) // Skip intercept
    ];
    csv += csvRow.join(',') + '\n';
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `regression_dataset_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  console.log(`Downloaded dataset with ${currentRegressionData.length} observations`);
}

