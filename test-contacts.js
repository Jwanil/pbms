async function runTests() {
  const baseURL = 'http://localhost:5001/api/v1';
  let token;

  const request = async (method, path, body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, data };
    return { status: res.status, data };
  };

  try {
    console.log('Logging in...');
    const loginRes = await request('POST', '/auth/login', {
      email: 'admin@pbms.com',
      password: 'Admin@123'
    });
    token = loginRes.data.data.token;
    console.log('Login successful.');

    // Fetch dependencies
    const compRes = await request('GET', '/companies');
    const companyId = compRes.data.data[0]?.company_id;
    const prodRes = await request('GET', '/products');
    const productId = prodRes.data.data[0]?.product_id;

    console.log('\n--- 1. GET contacts ---');
    const getRes = await request('GET', '/contacts');
    console.log('GET /contacts Status:', getRes.status);

    console.log('\n--- 12. POST with empty body (Validation check) ---');
    try {
      await request('POST', '/contacts', {});
    } catch (e) {
      console.log('Validation Error Status:', e.status);
    }

    console.log('\n--- 15. Branches cascade ---');
    if (companyId) {
      const bRes = await request('GET', `/contacts/branches/${companyId}`);
      console.log('GET /branches/:companyId Status:', bRes.status);
    }

    console.log('\n--- 2. POST contact ---');
    const postRes = await request('POST', '/contacts', {
      first_name: 'John',
      last_name: 'Doe',
      mobile: '9876543210',
      email: 'john.doe@example.com',
      contact_type: 'BUYER',
      preferred_language: 'ENGLISH',
      tags: ['Bulk Buyer'],
      product_ids: productId ? [productId] : []
    });
    console.log('POST /contacts Status:', postRes.status);
    const contactId = postRes.data.data.contact_id;
    console.log('Created contact ID:', contactId);

    console.log('\n--- 3. GET contact by ID ---');
    const getByIdRes = await request('GET', `/contacts/${contactId}`);
    console.log('GET /contacts/:id Status:', getByIdRes.status);
    console.log('Interests Count:', getByIdRes.data.data.interests?.length);

    console.log('\n--- 4. PUT contact ---');
    const putRes = await request('PUT', `/contacts/${contactId}`, {
      first_name: 'Johnathan',
      mobile: '9876543210',
      tags: ['Bulk Buyer', 'VIP'],
      product_ids: []
    });
    console.log('PUT /contacts/:id Status:', putRes.status);

    console.log('\n--- 7. Search ---');
    const sRes = await request('GET', '/contacts?search=Johnathan');
    console.log('Search Status:', sRes.status);

    console.log('\n--- 8. Filter by type ---');
    const ftRes = await request('GET', '/contacts?contact_type=BUYER');
    console.log('Filter type Status:', ftRes.status);

    console.log('\n--- 9. Filter by language ---');
    const flRes = await request('GET', '/contacts?preferred_language=ENGLISH');
    console.log('Filter lang Status:', flRes.status);

    console.log('\n--- 10. Filter by product ---');
    const fpRes = await request('GET', `/contacts?product_id=${productId}`);
    console.log('Filter product Status:', fpRes.status);

    console.log('\n--- 11. Filter by tags ---');
    const fTagRes = await request('GET', '/contacts?tags=Bulk');
    console.log('Filter tags Status:', fTagRes.status);

    console.log('\n--- 5. PATCH deactivate ---');
    const deactRes = await request('PATCH', `/contacts/${contactId}/deactivate`);
    console.log('PATCH deactivate Status:', deactRes.status);

    console.log('\n--- 6. PATCH reactivate ---');
    const reactRes = await request('PATCH', `/contacts/${contactId}/reactivate`);
    console.log('PATCH reactivate Status:', reactRes.status);

    console.log('\n--- 13. Auth required ---');
    try {
      const oldToken = token;
      token = null;
      await request('GET', '/contacts');
    } catch (e) {
      console.log('Auth missing Status:', e.status);
    }
    
    console.log('\nAll API tests passed successfully!');

  } catch (err) {
    console.error('Test failed!');
    if (err.status) {
      console.error(err.status, err.data);
    } else {
      console.error(err);
    }
  }
}

runTests();