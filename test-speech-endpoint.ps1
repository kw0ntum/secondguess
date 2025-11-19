# Speech-to-Text Endpoint Test Script
# This script tests the /api/speech/transcribe endpoint

Write-Host "=== Speech-to-Text Endpoint Test ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Step 1: Get authentication token
Write-Host "Step 1: Getting authentication token..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/guest" -Method POST -ContentType "application/json"
    $token = $authResponse.token
    Write-Host "✓ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get auth token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check speech service status
Write-Host "Step 2: Checking speech service status..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/speech/status" -Method GET
    Write-Host "✓ Service Status:" -ForegroundColor Green
    Write-Host "  - Ready: $($statusResponse.data.isReady)" -ForegroundColor White
    Write-Host "  - Language: $($statusResponse.data.currentLanguage)" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to check status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 3: Test transcribe endpoint with minimal data
Write-Host "Step 3: Testing transcribe endpoint..." -ForegroundColor Yellow

# Create a simple test audio data (base64 encoded "test")
$testAudioBase64 = "dGVzdCBhdWRpbyBkYXRh"

$requestBody = @{
    audioData = $testAudioBase64
    format = "WEBM"
    sampleRate = 48000
    channels = 1
    sessionId = "test-session-123"
} | ConvertTo-Json

Write-Host "Request body:" -ForegroundColor White
Write-Host $requestBody -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $transcribeResponse = Invoke-RestMethod -Uri "$baseUrl/api/speech/transcribe" -Method POST -Headers $headers -Body $requestBody
    Write-Host "✓ Transcribe endpoint responded successfully!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor White
    Write-Host ($transcribeResponse | ConvertTo-Json -Depth 5) -ForegroundColor Gray
} catch {
    Write-Host "✗ Transcribe endpoint failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get the response body
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
