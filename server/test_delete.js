async function test() {
  const jwt = require('fs').readFileSync('.env.development', 'utf8').split('\n').find(l => l.startsWith('TEST_JWT=')).split('=')[1];
  try {
    const res = await fetch('http://localhost:5001/api/v1/categories/1', {
      method: 'DELETE',
      headers: { 'Cookie': 'jwt=' + jwt }
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (err) {
    console.log(err);
  }
}
test();
