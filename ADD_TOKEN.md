# 🔑 How to Add Firebase Token to GitHub

The CI/CD pipeline needs a Firebase token to deploy. Here's how to add it:

## Step 1: Get Firebase CI Token

Open your terminal/command prompt and run:

```bash
firebase login:ci
```

This will:
1. Open your browser
2. Ask you to log in to Firebase
3. Display a token like this:

```
✔  Success! Use this token to authenticate on CI servers:

1/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Example: firebase deploy --token "$FIREBASE_TOKEN"
```

**⚠️ IMPORTANT**: Copy this entire token (it starts with `1/`). You won't be able to see it again!

## Step 2: Add Token to GitHub Secrets

1. **Go to your repository secrets page**:
   - Direct link: https://github.com/aanimesh-mcgill/freeriding/settings/secrets/actions
   - Or navigate: Repository → Settings → Secrets and variables → Actions

2. **Click "New repository secret"**

3. **Fill in the form**:
   - **Name**: `FIREBASE_TOKEN` (must be exactly this, case-sensitive)
   - **Value**: Paste the token you copied from step 1
   - Click **Add secret**

## Step 3: Test the Pipeline

After adding the token, the next push will automatically deploy:

```bash
git add .
git commit -m "Test deployment after adding token"
git push origin main
```

Or you can manually trigger it:
1. Go to **Actions** tab in GitHub
2. Click **Deploy to Firebase** workflow
3. Click **Run workflow** → **Run workflow**

## Verification

✅ **Success indicators**:
- Workflow shows green checkmark in Actions tab
- No error messages about missing token
- Deployment completes successfully
- Your app is live at: https://freeriding-a0ae7.web.app

❌ **If it still fails**:
- Double-check the token was copied completely (it's very long)
- Make sure the secret name is exactly `FIREBASE_TOKEN` (no spaces, correct case)
- Try generating a new token: `firebase login:ci`
- Check the workflow logs in GitHub Actions for specific error messages

## Token Security

- The token gives full access to your Firebase project
- Never commit the token to git (it's already in .gitignore)
- Only add it as a GitHub Secret (encrypted)
- If compromised, revoke it in Firebase Console and generate a new one

## Need Help?

If you're stuck:
1. Check the workflow logs in GitHub Actions
2. Verify the token is valid: `firebase projects:list --token "YOUR_TOKEN"`
3. Make sure you have permissions for the Firebase project

