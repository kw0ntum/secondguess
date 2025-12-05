@echo off
echo Setting up Netlify deployment...

REM Install function dependencies
echo Installing function dependencies...
cd netlify\functions
call npm install
cd ..\..

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Netlify CLI...
    call npm install -g netlify-cli
)

echo Setup complete!
echo.
echo Next steps:
echo 1. Run: netlify login
echo 2. Run: netlify init
echo 3. Set environment variables:
echo    netlify env:set GEMINI_API_KEY "your-key"
echo    netlify env:set JWT_SECRET "your-secret"
echo 4. Run: netlify deploy --prod
echo.
echo Or use GitHub integration (see NETLIFY_DEPLOYMENT.md)
pause
