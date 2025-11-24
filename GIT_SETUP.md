# Git and CI/CD Setup Guide

## Initial Push to GitHub

Since this is a new repository, you'll need to push the code for the first time:

### Option 1: Using Personal Access Token (Recommended)

1. **Generate a Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click **Generate new token (classic)**
   - Name: "Free-Riding Experiment"
   - Select scopes: `repo` (full control)
   - Click **Generate token**
   - **Copy the token immediately** (you won't see it again)

2. **Push to GitHub**
   ```bash
   git push -u origin main
   ```
   When prompted for password, use your Personal Access Token (not your GitHub password).

### Option 2: Using SSH (Alternative)

1. **Set up SSH key** (if not already done)
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   Add the public key to GitHub: https://github.com/settings/keys

2. **Change remote to SSH**
   ```bash
   git remote set-url origin git@github.com:aanimesh-mcgill/freeriding.git
   ```

3. **Push to GitHub**
   ```bash
   git push -u origin main
   ```

## CI/CD Pipeline Setup

After pushing code, set up automatic deployment:

### 1. Get Firebase CI Token

```bash
firebase login:ci
```

This will output a token like:
```
✔  Success! Use this token to authenticate on CI servers:

1/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Example: firebase deploy --token "$FIREBASE_TOKEN"
```

### 2. Add Token to GitHub Secrets

1. Go to your repository: https://github.com/aanimesh-mcgill/freeriding
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from step 1
6. Click **Add secret**

### 3. Test the Pipeline

1. Make a small change to any file
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Go to **Actions** tab in GitHub
4. You should see the workflow running
5. Once complete, your changes will be live on Firebase!

## Workflow Behavior

- **Automatic**: Every push to `main` branch triggers deployment
- **Manual**: You can also trigger from Actions tab → "Deploy to Firebase" → "Run workflow"
- **Deploys**: 
  - Firestore rules
  - Firebase Hosting

## Troubleshooting

### Push fails with authentication error
- Use Personal Access Token instead of password
- Or set up SSH keys

### CI/CD fails with "FIREBASE_TOKEN not found"
- Make sure you added the secret in GitHub
- Secret name must be exactly: `FIREBASE_TOKEN`
- Check that the token is still valid (run `firebase login:ci` again if needed)

### Deployment fails
- Check workflow logs in GitHub Actions tab
- Verify Firebase project ID in `.firebaserc`
- Make sure you have permissions for the Firebase project

## Current Status

✅ Git repository initialized
✅ All files committed
✅ Remote repository configured
✅ GitHub Actions workflow created
⏳ **Next step**: Push to GitHub and set up FIREBASE_TOKEN secret

