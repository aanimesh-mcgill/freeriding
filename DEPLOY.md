# Firebase Deployment Guide

## Prerequisites

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Verify Project Connection**
   ```bash
   firebase projects:list
   ```
   You should see `freeriding-a0ae7` in the list.

## Initial Setup

### 1. Initialize Firebase (if not already done)
```bash
firebase init
```
- Select: Firestore and Hosting
- Use existing project: `freeriding-a0ae7`
- The configuration files are already set up, so you can skip this if files exist.

### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```
This deploys the security rules from `firestore.rules`.

### 3. Deploy Hosting
```bash
firebase deploy --only hosting
```

### 4. Deploy Everything
```bash
firebase deploy
```
This deploys both Firestore rules and hosting.

## Deployment URLs

After deployment, your app will be available at:
- **Main Experiment**: `https://freeriding-a0ae7.web.app` or `https://freeriding-a0ae7.firebaseapp.com`
- **Admin Dashboard**: `https://freeriding-a0ae7.web.app/admin` or `https://freeriding-a0ae7.web.app/admin.html`

## Quick Deploy Commands

### Deploy Only Hosting (Fast Updates)
```bash
firebase deploy --only hosting
```

### Deploy Only Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Both
```bash
firebase deploy
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Test locally by opening `index.html` in browser
- [ ] Verify Firebase configuration in `app.js` and `admin.js`
- [ ] Check that Firestore rules are appropriate for your use case
- [ ] Test admin dashboard functionality
- [ ] Verify all files are included (index.html, admin.html, app.js, admin.js, style.css)
- [ ] Test with a sample participant ID

## Post-Deployment

1. **Test the Live Site**
   - Visit your Firebase hosting URL
   - Test participant flow with a test ID
   - Test admin dashboard

2. **Verify Firestore Connection**
   - Check browser console for errors
   - Verify data is being saved to Firestore
   - Check Firestore console in Firebase

3. **Set Up Custom Domain (Optional)**
   - Go to Firebase Console → Hosting
   - Click "Add custom domain"
   - Follow the setup instructions

## Troubleshooting

### "Permission denied" errors
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check rules in Firebase Console → Firestore → Rules

### Files not updating
- Clear browser cache
- Check that files are in the correct directory
- Verify `firebase.json` ignore list isn't excluding needed files

### Hosting deployment fails
- Check that you're logged in: `firebase login`
- Verify project: `firebase use freeriding-a0ae7`
- Check file permissions

## Continuous Deployment

For automatic deployments on git push, you can set up GitHub Actions:

1. Create `.github/workflows/deploy.yml`
2. Add Firebase token as GitHub secret
3. Configure workflow to deploy on push to main branch

## Rollback

If you need to rollback:
```bash
firebase hosting:clone <previous-deployment-id>
```

Or redeploy previous version from git history.

## Monitoring

- **Firebase Console**: Monitor hosting usage, Firestore reads/writes
- **Analytics**: Check Firebase Analytics for user behavior
- **Performance**: Monitor app performance in Firebase Console

## Security Notes

Before going live:
1. Review Firestore security rules
2. Consider adding Firebase Authentication for admin dashboard
3. Set up proper CORS if needed
4. Review data privacy requirements

