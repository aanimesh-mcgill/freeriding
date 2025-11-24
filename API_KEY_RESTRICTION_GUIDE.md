# Step-by-Step: Restrict Firebase API Key

## Quick Steps

### 1. Open Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials?project=freeriding-a0ae7

### 2. Find Your API Key
- Look for the key: `AIzaSyDSfD_46CbKBi8qX7oly-Lh80ErKE1QYnM`
- Click on it to edit

### 3. Application Restrictions
**Select**: HTTP referrers (web sites)

**Add these referrers** (one per line):
```
https://freeriding-a0ae7.web.app/*
https://freeriding-a0ae7.firebaseapp.com/*
http://localhost:*
http://127.0.0.1:*
```

### 4. API Restrictions
**Select**: Restrict key

**Check ONLY**:
- ✅ Cloud Firestore API
- ✅ Firebase Installations API

**Uncheck everything else**

### 5. Save
Click "Save" at the bottom

## Visual Guide

```
┌─────────────────────────────────────┐
│ Application restrictions            │
│ ○ None                              │
│ ● HTTP referrers (web sites)  ← Select this
│   ┌─────────────────────────────┐ │
│   │ https://freeriding-a0ae7... │ │
│   │ https://freeriding-a0ae7... │ │
│   │ http://localhost:*           │ │
│   └─────────────────────────────┘ │
├─────────────────────────────────────┤
│ API restrictions                    │
│ ● Restrict key  ← Select this
│   ┌─────────────────────────────┐ │
│   │ ☑ Cloud Firestore API       │ │
│   │ ☑ Firebase Installations API│ │
│   │ ☐ (everything else unchecked)│ │
│   └─────────────────────────────┘ │
└─────────────────────────────────────┘
```

## After Restricting

1. **Test Your App**: 
   - Visit: https://freeriding-a0ae7.web.app
   - Should work normally

2. **Test from Unauthorized Domain**:
   - The API key should be blocked
   - This is the security working!

3. **Wait for Alert Resolution**:
   - Google's alert should clear in 24-48 hours
   - No further action needed

## Troubleshooting

**If your app stops working after restrictions:**
- Check that all your domains are in the referrer list
- Make sure Firestore API is checked
- Verify the key hasn't been accidentally deleted

**If you need to add more domains later:**
- Just edit the API key again
- Add the new domain to the referrer list
- Save

