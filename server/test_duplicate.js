async function test() {
  const jwt = require('fs').readFileSync('.env.development', 'utf8').split('\n').find(l => l.startsWith('TEST_JWT=')).split('=')[1];
  try {
    const res = await fetch('http://localhost:5001/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'jwt=' + jwt },
      body: JSON.stringify({
        name: 'Test',
        email: 'superadmin@itpl.com',
        username: 'test1234',
        password: 'Password1!',
        mobile: '1234567890',
        role_id: 1
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (err) {
    console.log(err);
  }
}
test();
