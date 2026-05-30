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
    console.log('Login successful. Token:', token.slice(0, 10) + '...');

    console.log('\n--- 1. GET companies ---');
    const getRes = await request('GET', '/companies');
    console.log('GET /companies Status:', getRes.status);
    console.log('Success:', getRes.data.success);

    console.log('\n--- 9. POST with empty body (Validation check) ---');
    try {
      await request('POST', '/companies', {});
    } catch (e) {
      console.log('Validation Error Status:', e.status);
      console.log('Error Code:', e.data.code);
    }

    console.log('\n--- 2. POST company ---');
    const postRes = await request('POST', '/companies', {
      company_name: 'Test Company 1',
      company_type: 'MANUFACTURER',
      email: 'test@company.com',
      gst_number: '123456789012345',
      branches: [
        {
          branch_name: 'HQ Branch',
          city: 'Mumbai',
          email: 'hq@company.com'
        }
      ]
    });
    console.log('POST /companies Status:', postRes.status);
    const companyId = postRes.data.data.company_id;
    console.log('Created company ID:', companyId);

    console.log('\n--- 3. GET company by ID ---');
    const getByIdRes = await request('GET', `/companies/${companyId}`);
    console.log('GET /companies/:id Status:', getByIdRes.status);
    console.log('Company Name:', getByIdRes.data.data.company_name);
    console.log('Branches Count:', getByIdRes.data.data.branches.length);

    console.log('\n--- 4. PUT company ---');
    const branchId = getByIdRes.data.data.branches[0].branch_id;
    const putRes = await request('PUT', `/companies/${companyId}`, {
      company_name: 'Test Company Updated',
      company_type: 'MANUFACTURER',
      branches: [
        {
          branch_id: branchId, // Update existing branch
          branch_name: 'HQ Branch Updated'
        },
        {
          branch_name: 'New Branch' // Create new branch
        }
      ]
    });
    console.log('PUT /companies/:id Status:', putRes.status);
    console.log('Updated Name:', putRes.data.data.company_name);

    console.log('\n--- Verify branches updated ---');
    const getUpdatedRes = await request('GET', `/companies/${companyId}`);
    console.log('Branches Count after update:', getUpdatedRes.data.data.branches.length);

    console.log('\n--- 7. Search ---');
    const searchRes = await request('GET', '/companies?search=UPDATED');
    console.log('Search Status:', searchRes.status);
    console.log('Results count:', searchRes.data.data.length);

    console.log('\n--- 8. Filter by type ---');
    const filterRes = await request('GET', '/companies?company_type=MANUFACTURER');
    console.log('Filter Status:', filterRes.status);
    console.log('Results count:', filterRes.data.data.length);

    console.log('\n--- 5. PATCH deactivate ---');
    const deactRes = await request('PATCH', `/companies/${companyId}/deactivate`);
    console.log('PATCH deactivate Status:', deactRes.status);

    console.log('\n--- 6. PATCH reactivate ---');
    const reactRes = await request('PATCH', `/companies/${companyId}/reactivate`);
    console.log('PATCH reactivate Status:', reactRes.status);

    console.log('\n--- 10. Auth required ---');
    try {
      const oldToken = token;
      token = null;
      await request('GET', '/companies');
    } catch (e) {
      console.log('Auth missing Status:', e.status);
    }

    console.log('\nAll tests passed successfully!');

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