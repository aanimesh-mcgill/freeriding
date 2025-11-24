# GitHub Actions Workflows

## Setup Instructions

### 1. Get Firebase Token

You need to generate a Firebase CI token for GitHub Actions:

```bash
firebase login:ci
```

This will output a token. Copy this token.

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/aanimesh-mcgill/freeriding
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from step 1
6. Click **Add secret**

### 3. Workflow Behavior

The workflow (`deploy.yml`) will automatically:
- Trigger on every push to `main` branch
- Deploy Firestore rules
- Deploy to Firebase Hosting
- Can also be manually triggered from GitHub Actions tab

### 4. Manual Deployment

You can also manually trigger the deployment:
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Firebase** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Troubleshooting

If deployment fails:
1. Check that `FIREBASE_TOKEN` secret is set correctly
2. Verify Firebase project ID matches in `.firebaserc`
3. Check workflow logs in GitHub Actions tab

