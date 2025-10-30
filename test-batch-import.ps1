# Test Batch Import Functionality

# Configuration
$BASE_URL = "http://localhost:8787"
$ADMIN_EMAIL = "admin@xpanel.com"
$ADMIN_PASSWORD = "admin123"

Write-Host "Starting batch import test..." -ForegroundColor Green

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

# 3. Batch import nodes
Write-Host "3. Batch importing nodes..." -ForegroundColor Yellow
$nodeText = "8.39.125.153:2053#SG Official 65ms`n8.35.211.239:2053#SG Official 67ms`n172.64.52.58:2053#SG Official 67ms`n162.159.35.75:2053#SG Official 68ms`n172.64.157.154:2053#SG Official 68ms`n37.153.171.94:2053#US Official 166ms`n64.239.31.202:2053#US Official 166ms`n23.227.60.82:2053#US Official 167ms`n45.196.29.73:2053#US Official 167ms`n154.81.141.58:2053#US Official 167ms"

$importBody = @{
    text = $nodeText
    group_id = $groupId
} | ConvertTo-Json

try {
    $importResponse = Invoke-WebRequest -Uri "$BASE_URL/api/admin/edgetunnel/nodes/batch-import" -Method POST -Body $importBody -ContentType "application/json" -Headers @{Authorization = "Bearer $token"}
    $importData = $importResponse.Content | ConvertFrom-Json
    
    Write-Host "Import response: $($importResponse.Content)" -ForegroundColor Cyan
    
    if (-not $importData.success) {
        throw "Batch import failed: $($importData.message)"
    }
    
    Write-Host "Batch import successful, imported $($importData.data.nodes.Count) nodes" -ForegroundColor Green
} catch {
    Write-Host "Batch import failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Verify imported nodes
Write-Host "4. Verifying imported nodes..." -ForegroundColor Yellow
try {
    $nodesResponse = Invoke-WebRequest -Uri "$BASE_URL/api/admin/edgetunnel/nodes/group/$groupId" -Method GET -Headers @{Authorization = "Bearer $token"}
    $nodesData = $nodesResponse.Content | ConvertFrom-Json
    
    if (-not $nodesData.success) {
        throw "Failed to get nodes: $($nodesData.message)"
    }
    
    Write-Host "Successfully retrieved $($nodesData.data.nodes.Count) nodes" -ForegroundColor Green
    Write-Host "Node list:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $nodesData.data.nodes.Count; $i++) {
        $node = $nodesData.data.nodes[$i]
        Write-Host "  $($i + 1). $($node.name) ($($node.host):$($node.port))" -ForegroundColor White
    }
    
    Write-Host "All tests completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to verify nodes: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}