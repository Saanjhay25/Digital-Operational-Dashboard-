import fetch from 'node-fetch';

async function testFlow() {
    const baseUrl = 'http://localhost:5000/api/auth';
    const testUser = {
        name: 'Test Account',
        username: 'testuser' + Math.floor(Math.random() * 1000),
        password: 'Password123!'
    };

    console.log('1. Registering user:', testUser.username);
    const regRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });

    const regData = await regRes.json();
    console.log('Register Status:', regRes.status);
    console.log('Register Response:', JSON.stringify(regData));

    if (regRes.status !== 201 && regRes.status !== 400) {
        console.error('Registration failed unexpectedly');
        return;
    }

    console.log('\n2. Testing login with email (username alias):', testUser.username);
    const logRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.username, password: testUser.password })
    });

    const logData = await logRes.json();
    console.log('Login Status:', logRes.status);
    console.log('Login Response:', JSON.stringify(logData));

    if (logRes.status === 200) {
        console.log('\nSUCCESS: Full auth flow works!');
    } else {
        console.log('\nFAILURE: Auth flow failed');
    }
}

testFlow();
