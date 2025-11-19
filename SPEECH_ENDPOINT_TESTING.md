# Speech Endpoint Testing Guide

## The 400 Error Explained

A **400 Bad Request** error means the endpoint is accessible, but the request data is invalid. Common causes:

1. **Missing `audioData` field** - The endpoint requires this field
2. **Invalid audio format** - The audio data must be valid base64
3. **Audio validation failure** - The `validateAudioStream()` function rejects the data
4. **Missing authentication token** - Though this would typically be 401, not 400

## Test Files Created

### 1. PowerShell Test Script: `test-speech-endpoint.ps1`

Run this from the command line to test the endpoint:

```powershell
cd V_secondguess/secondguess
.\test-speech-endpoint.ps1
```

This script will:
- ✓ Get an authentication token
- ✓ Check the speech service status
- ✓ Test the transcribe endpoint with sample data
- ✓ Show detailed error messages if anything fails

### 2. Browser Test Page: `test-speech.html`

Open this in your browser to test with real audio:

```
http://localhost:3000/test-speech.html
```

This page will:
- ✓ Run automated tests on page load
- ✓ Show the exact request/response data
- ✓ Let you test with real microphone recording
- ✓ Display detailed error information

## Quick Command Line Tests

### Test 1: Check Service Status
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/speech/status" -Method GET
```

### Test 2: Get Auth Token
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/guest" -Method POST -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

### Test 3: Test Transcribe Endpoint
```powershell
$body = @{
    audioData = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("test"))
    format = "WEBM"
    sampleRate = 48000
    channels = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/speech/transcribe" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $body
```

## Debugging the 400 Error

### Check the Server Logs

The server logs will show exactly why the request failed. Look for:
- "Missing required field: audioData"
- "Invalid audio stream data"
- "Speech-to-Text service is not ready"

### Common Issues:

1. **Empty audioData**
   - Make sure the audio blob is not empty
   - Check that base64 encoding is working

2. **Invalid Audio Format**
   - The endpoint expects base64-encoded audio
   - WebM format should work, but might need proper encoding

3. **Service Not Ready**
   - Check if Google Cloud credentials are configured
   - Run: `curl http://localhost:3000/api/speech/status`
   - Should return `isReady: true`

4. **Authentication Issues**
   - Make sure the Bearer token is included
   - Token should be in the format: `Authorization: Bearer <token>`

## What to Check in Browser Console

When testing in the browser, check:

1. **Network Tab**
   - Look at the request payload
   - Check if `audioData` field exists and has content
   - Verify the Authorization header is present

2. **Console Logs**
   - Look for any JavaScript errors
   - Check if `authToken` is defined
   - Verify `API_BASE` is correct

3. **Response Body**
   - The 400 response should include an error message
   - This will tell you exactly what's wrong

## Expected Successful Response

```json
{
  "success": true,
  "data": {
    "text": "transcribed text here",
    "confidence": 0.95,
    "segments": [...],
    "language": "en-US",
    "sessionId": "...",
    "timestamp": "2025-11-17T..."
  }
}
```

## Expected Error Responses

### 400 - Missing audioData
```json
{
  "success": false,
  "error": "Missing required field: audioData"
}
```

### 400 - Invalid audio stream
```json
{
  "success": false,
  "error": "Invalid audio stream data"
}
```

### 503 - Service not ready
```json
{
  "success": false,
  "error": "Speech-to-Text service is not ready. Please check your Google Cloud credentials."
}
```

## Next Steps

1. Run `.\test-speech-endpoint.ps1` to see the exact error
2. Open `http://localhost:3000/test-speech.html` to test in browser
3. Check the server console for detailed error logs
4. Verify Google Cloud credentials are configured if service shows not ready
