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

    console.log('\n--- 1. GET products ---');
    const getRes = await request('GET', '/products');
    console.log('GET /products Status:', getRes.status);
    console.log('Success:', getRes.data.success);

    console.log('\n--- 9. GET form-data ---');
    const formRes = await request('GET', '/products/form-data');
    console.log('GET /products/form-data Status:', formRes.status);
    console.log('Categories count:', formRes.data.data.categories.length);

    console.log('\n--- 2. POST product ---');
    const postRes = await request('POST', '/products', {
      product_name: 'Test Product 1',
      sku: 'SKU-001',
      cas_number: '123-45-6',
      unit_of_measure: 'KG'
    });
    console.log('POST /products Status:', postRes.status);
    const productId = postRes.data.data.product_id;
    console.log('Created product ID:', productId);

    console.log('\n--- 3. POST duplicate SKU ---');
    try {
      await request('POST', '/products', { product_name: 'Test Product 2', sku: 'SKU-001' });
    } catch (e) {
      console.log('POST duplicate SKU Status:', e.status);
    }

    console.log('\n--- 4. POST duplicate CAS ---');
    try {
      await request('POST', '/products', { product_name: 'Test Product 3', sku: 'SKU-002', cas_number: '123-45-6' });
    } catch (e) {
      console.log('POST duplicate CAS Status:', e.status);
    }

    console.log('\n--- 5. GET product by ID ---');
    const getByIdRes = await request('GET', `/products/${productId}`);
    console.log('GET /products/:id Status:', getByIdRes.status);
    console.log('Product Name:', getByIdRes.data.data.product_name);

    console.log('\n--- 6. PUT product ---');
    const putRes = await request('PUT', `/products/${productId}`, {
      product_name: 'Test Product Updated',
      sku: 'SKU-001-UPDATED'
    });
    console.log('PUT /products/:id Status:', putRes.status);
    console.log('Updated Name:', putRes.data.data.product_name);

    console.log('\n--- 7. PATCH deactivate ---');
    const deactRes = await request('PATCH', `/products/${productId}/deactivate`);
    console.log('PATCH deactivate Status:', deactRes.status);

    console.log('\n--- 8. PATCH reactivate ---');
    const reactRes = await request('PATCH', `/products/${productId}/reactivate`);
    console.log('PATCH reactivate Status:', reactRes.status);

    console.log('\n--- 10. Search ---');
    const searchRes = await request('GET', '/products?search=UPDATED');
    console.log('Search Status:', searchRes.status);
    console.log('Results count:', searchRes.data.data.length);

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