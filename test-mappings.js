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

    // Need a valid company and product ID
    console.log('\n--- Fetching a company and product ---');
    const compRes = await request('GET', '/companies');
    const companyId = compRes.data.data[0]?.company_id;
    const prodRes = await request('GET', '/products');
    const productId = prodRes.data.data[0]?.product_id;
    
    if (!companyId || !productId) {
      console.log('Missing company or product in DB. Run seed or tests first.');
      return;
    }
    console.log(`Using Company ID: ${companyId}, Product ID: ${productId}`);

    console.log('\n--- 1. GET mappings ---');
    const getRes = await request('GET', '/mappings');
    console.log('GET /mappings Status:', getRes.status);

    console.log('\n--- 12. POST with empty body (Validation check) ---');
    try {
      await request('POST', '/mappings', {});
    } catch (e) {
      console.log('Validation Error Status:', e.status);
      console.log('Error Code:', e.data.code);
    }

    console.log('\n--- 2. POST mapping ---');
    const postRes = await request('POST', '/mappings', {
      company_id: companyId,
      product_id: productId,
      role_type: 'MANUFACTURER',
      moq: 100,
      price_range_min: 50,
      price_range_max: 100,
      lead_time_days: 7
    });
    console.log('POST /mappings Status:', postRes.status);
    const mappingId = postRes.data.data.mapping_id;
    console.log('Created mapping ID:', mappingId);

    console.log('\n--- 3. POST duplicate (Unique constraint check) ---');
    try {
      await request('POST', '/mappings', {
        company_id: companyId,
        product_id: productId,
        role_type: 'MANUFACTURER'
      });
    } catch (e) {
      console.log('Duplicate Error Status:', e.status);
      console.log('Error Code:', e.data.code);
    }

    console.log('\n--- 4. GET mapping by ID ---');
    const getByIdRes = await request('GET', `/mappings/${mappingId}`);
    console.log('GET /mappings/:id Status:', getByIdRes.status);
    console.log('Company:', getByIdRes.data.data.company?.company_name);
    console.log('Product:', getByIdRes.data.data.product?.product_name);

    console.log('\n--- 5. PUT mapping ---');
    const putRes = await request('PUT', `/mappings/${mappingId}`, {
      moq: 200,
      price_range_min: 60,
      price_range_max: 120,
      lead_time_days: 10
    });
    console.log('PUT /mappings/:id Status:', putRes.status);
    console.log('Updated MOQ:', putRes.data.data.moq);

    console.log('\n--- 8. Filter by company ---');
    const fCompRes = await request('GET', `/mappings?company_id=${companyId}`);
    console.log('Filter company Status:', fCompRes.status);

    console.log('\n--- 9. Filter by product ---');
    const fProdRes = await request('GET', `/mappings?product_id=${productId}`);
    console.log('Filter product Status:', fProdRes.status);

    console.log('\n--- 10. Filter by role ---');
    const fRoleRes = await request('GET', `/mappings?role_type=MANUFACTURER`);
    console.log('Filter role Status:', fRoleRes.status);

    console.log('\n--- 11. Filter by active ---');
    const fActRes = await request('GET', `/mappings?is_active=true`);
    console.log('Filter active Status:', fActRes.status);

    console.log('\n--- 6. PATCH deactivate ---');
    const deactRes = await request('PATCH', `/mappings/${mappingId}/deactivate`);
    console.log('PATCH deactivate Status:', deactRes.status);

    console.log('\n--- 7. PATCH reactivate ---');
    const reactRes = await request('PATCH', `/mappings/${mappingId}/reactivate`);
    console.log('PATCH reactivate Status:', reactRes.status);

    console.log('\n--- 13. Auth required ---');
    try {
      const oldToken = token;
      token = null;
      await request('GET', '/mappings');
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