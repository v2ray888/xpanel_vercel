const { default: fetch } = require('node-fetch');

async function testEnv() {
    try {
        console.log('Testing environment variables...');
        console.log('URL: http://127.0.0.1:8788/api/test-env');
        
        const response = await fetch('http://127.0.0.1:8788/api/test-env', {
            method: 'GET',
            headers: {
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

testEnv();