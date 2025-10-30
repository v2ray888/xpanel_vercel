const { default: fetch } = require('node-fetch');

async function testRoute() {
    try {
        console.log('Testing EdgeTunnel test route...');
        console.log('URL: http://127.0.0.1:8788/api/admin/edgetunnel/users/test');
        
        const response = await fetch('http://127.0.0.1:8788/api/admin/edgetunnel/users/test', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOjEsImV4cCI6MTc2MTU5Mzk4NywiaWF0IjoxNzYxNTkwMzg3fQ.lH2lBmL09TEqRBoouZncAJPpyHCTLmRpPiRJLdXTe3s',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        const text = await response.text();
        console.log('Response Text:', text);
        
        try {
            const data = JSON.parse(text);
            console.log('Response JSON:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Response is not JSON');
        }
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Error stack:', error.stack);
    }
}

testRoute();