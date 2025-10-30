# Test API with authentication

# Configuration
$BASE_URL = "http://127.0.0.1:8787"
$ADMIN_EMAIL = "admin@xpanel.com"
$ADMIN_PASSWORD = "admin123"

Write-Host "Testing API with authentication..." -ForegroundColor Green

# 1. Admin login
Write-Host "1. Admin login..." -ForegroundColor Yellow
$loginBody = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$BASE_URL/api/auth/admin-login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if (-not $loginData.success) {
        throw "Login failed: $($loginData.message)"
    }
    
    $token = $loginData.data.token
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "Token: $token" -ForegroundColor Cyan
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Create test group
Write-Host "2. Creating test group..." -ForegroundColor Yellow
$groupBody = @{
    name = "Test Group"
    description = "Group for batch import testing"
    api_endpoint = "https://api.example.com"
    api_key = "test-api-key"
    max_users = 100
} | ConvertTo-Json

try {
    $groupResponse = Invoke-WebRequest -Uri "$BASE_URL/api/admin/edgetunnel/groups" -Method POST -Body $groupBody -ContentType "application/json" -Headers @{Authorization = "Bearer $token"}
    $groupData = $groupResponse.Content | ConvertFrom-Json
    
    if (-not $groupData.success) {
        throw "Group creation failed: $($groupData.message)"
    }
    
    $groupId = $groupData.data.id
    Write-Host "Group created successfully, ID: $groupId" -ForegroundColor Green
} catch {
    Write-Host "Group creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Test batch import
Write-Host "3. Testing batch import..." -ForegroundColor Yellow
$nodeText = "8.39.125.153:2053#SG Official 65ms`n8.35.211.239:2053#SG Official 67ms`n172.64.52.58:2053#SG Official 67ms"

$importBody = @{
    text = $nodeText
    group_id = $groupId
} | ConvertTo-Json

try {
    $importResponse = Invoke-WebRequest -Uri "$BASE_URL/api/admin/edgetunnel/nodes/batch-import" -Method POST -Body $importBody -ContentType "application/json" -Headers @{Authorization = "Bearer $token"}
    $importData = $importResponse.Content | ConvertFrom-Json
    
    Write-Host "Import response: $($importResponse.Content)" -ForegroundColor Cyan
    
    # 验证协议是否为vless
    if ($importData.data.nodes[0].protocol -eq "vless") {
        Write-Host "Protocol correctly set to vless" -ForegroundColor Green
    } else {
        Write-Host "Protocol is not vless: $($importData.data.nodes[0].protocol)" -ForegroundColor Red
    }
    
    if (-not $importData.success) {
        throw "Batch import failed: $($importData.message)"
    }
    
    Write-Host "Batch import successful" -ForegroundColor Green
} catch {
    Write-Host "Batch import failed: $($_.Exception.Message)" -ForegroundColor Red
}