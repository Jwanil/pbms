const jwt = require('jsonwebtoken');
const fs = require('fs');

const env = fs.readFileSync('.env.development', 'utf8');
const secret = env.split('\n').find(l => l.startsWith('JWT_SECRET=')).split('=')[1];

const token = jwt.sign({
  user_id: 1,
  email: 'superadmin@itpl.com',
  role_id: 1,
  name: 'Super Admin'
}, secret, { expiresIn: '1h' });

async function test() {
  const res = await fetch('http://localhost:5001/api/v1/categories/1', {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}
test();
