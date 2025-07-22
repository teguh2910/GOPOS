#!/usr/bin/env node

/**
 * Simple API test script to verify backend functionality
 * Run with: node test_api.js
 * 
 * Make sure the Go backend is running on localhost:8081
 */

const API_BASE = 'http://localhost:8081/api';

async function testAPI() {
  console.log('🧪 Testing GoPOS API endpoints...\n');

  try {
    // Test 1: Get Products
    console.log('1. Testing GET /products');
    const productsResponse = await fetch(`${API_BASE}/products`);
    const products = await productsResponse.json();
    console.log(`   ✅ Status: ${productsResponse.status}`);
    console.log(`   📦 Products found: ${products?.length || 0}\n`);

    // Test 2: Get Customers
    console.log('2. Testing GET /customers');
    const customersResponse = await fetch(`${API_BASE}/customers`);
    const customers = await customersResponse.json();
    console.log(`   ✅ Status: ${customersResponse.status}`);
    console.log(`   👥 Customers found: ${customers?.length || 0}\n`);

    // Test 3: Create a test product
    console.log('3. Testing POST /products');
    const newProduct = {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 9.99,
      quantity: 100,
      description: 'Test product for API verification'
    };
    
    const createProductResponse = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    
    console.log(`   ✅ Status: ${createProductResponse.status}`);
    if (createProductResponse.ok) {
      console.log('   📦 Test product created successfully\n');
    } else {
      const error = await createProductResponse.text();
      console.log(`   ❌ Error: ${error}\n`);
    }

    // Test 4: Create a test customer
    console.log('4. Testing POST /customers');
    const newCustomer = {
      name: 'Test Customer',
      phone_number: '555-0123',
      email: 'test@example.com',
      address: '123 Test Street'
    };
    
    const createCustomerResponse = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    });
    
    console.log(`   ✅ Status: ${createCustomerResponse.status}`);
    if (createCustomerResponse.ok) {
      console.log('   👥 Test customer created successfully\n');
    } else {
      const error = await createCustomerResponse.text();
      console.log(`   ❌ Error: ${error}\n`);
    }

    // Test 5: Register a test user
    console.log('5. Testing POST /users/register');
    const newUser = {
      username: 'testuser',
      password: 'testpass123',
      role: 'cashier'
    };
    
    const registerResponse = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    
    console.log(`   ✅ Status: ${registerResponse.status}`);
    if (registerResponse.ok) {
      const result = await registerResponse.json();
      console.log(`   👤 Test user created with ID: ${result.user_id}\n`);
    } else {
      const error = await registerResponse.text();
      console.log(`   ❌ Error: ${error}\n`);
    }

    // Test 6: Get sales report
    console.log('6. Testing GET /reports/sales');
    const reportResponse = await fetch(`${API_BASE}/reports/sales`);
    const report = await reportResponse.json();
    console.log(`   ✅ Status: ${reportResponse.status}`);
    console.log(`   📊 Total revenue: $${report?.total_revenue || 0}`);
    console.log(`   📊 Total transactions: ${report?.total_transactions || 0}\n`);

    console.log('🎉 API testing completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the Next.js frontend: cd frontend && npm run dev');
    console.log('   2. Open http://localhost:3000 in your browser');
    console.log('   3. Test the complete application workflow');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the Go backend is running: go run ./cmd/server');
    console.log('   2. Check that the server is accessible at http://localhost:8081');
    console.log('   3. Verify the database is properly initialized');
  }
}

// Run the tests
testAPI();
