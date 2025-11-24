@echo off
echo ========================================
echo Free-Riding Experiment - Firebase Deploy
echo ========================================
echo.

echo Checking Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Firebase CLI not found!
    echo Please install it with: npm install -g firebase-tools
    pause
    exit /b 1
)

echo.
echo Current Firebase project: freeriding-a0ae7
echo.

echo Deploying Firestore rules...
firebase deploy --only firestore:rules
if errorlevel 1 (
    echo ERROR: Failed to deploy Firestore rules!
    pause
    exit /b 1
)

echo.
echo Deploying hosting...
firebase deploy --only hosting
if errorlevel 1 (
    echo ERROR: Failed to deploy hosting!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your app is live at:
echo - Main: https://freeriding-a0ae7.web.app
echo - Admin: https://freeriding-a0ae7.web.app/admin
echo.
pause

