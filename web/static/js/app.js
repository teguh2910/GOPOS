document.addEventListener('DOMContentLoaded', () => {
    // Check login status on load
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
        document.getElementById('user-id-display').textContent = loggedInUserId;
        showPage('pos'); // Default to POS page if logged in
    } else {
        showPage('login'); // Show login page if not
    }
});

const API_BASE_URL = '/api';
const contentContainer = document.getElementById('app-content');

function showPage(page) {
    // Simple router
    switch (page) {
        case 'login':
            contentContainer.innerHTML = getLoginPageHTML();
            break;
        case 'pos':
            contentContainer.innerHTML = getPosPageHTML();
            loadPosData();
            break;
        case 'products':
            contentContainer.innerHTML = getProductsPageHTML();
            loadProducts();
            break;
        case 'customers':
            contentContainer.innerHTML = getCustomersPageHTML();
            loadCustomers();
            break;
        case 'reports':
            contentContainer.innerHTML = getReportsPageHTML();
            loadReport();
            break;
        default:
            contentContainer.innerHTML = `<h1>Page Not Found</h1>`;
    }
    updateNav(page);
}

function updateNav(activePage) {
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('onclick').includes(`'${activePage}'`)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function getLoginPageHTML() {
    return `
        <div class="page-content">
            <h2>Login</h2>
            <form onsubmit="handleLogin(event)">
                <p>Since this is a lightweight demo without full authentication, please enter your User ID to 'log in'.</p>
                <p>You can create a user via the API or assume User ID 1 exists.</p>
                <input type="number" id="login-user-id" placeholder="Enter User ID" required>
                <button type="submit">Login</button>
            </form>
            <h2>Register New User</h2>
            <form onsubmit="handleRegister(event)">
                <input type="text" id="register-username" placeholder="Username" required>
                <input type="password" id="register-password" placeholder="Password" required>
                <button type="submit">Register</button>
            </form>
        </div>
    `;
}

async function handleLogin(event) {
    event.preventDefault();
    const userId = document.getElementById('login-user-id').value;
    if (userId) {
        localStorage.setItem('loggedInUserId', userId);
        document.getElementById('user-id-display').textContent = userId;
        showPage('pos');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role: 'cashier' })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Registration failed: ${errorText}`);
        }

        const result = await response.json();
        alert(`User registered successfully! Your new User ID is: ${result.user_id}. Please log in with it.`);
        showPage('login'); // Refresh login page
    } catch (error) {
        console.error('Registration error:', error);
        alert(error.message);
    }
}

// --- POS Page ---
let posProducts = [];
let cart = [];

function getPosPageHTML() {
    return `
        <div class="page-content pos-grid">
            <div id="product-list">
                <h2>Products</h2>
                <div class="product-grid">
                    <!-- Products will be loaded here -->
                </div>
            </div>
            <div id="cart-section">
                <h2>Cart</h2>
                <div id="cart-items"></div>
                <div class="cart-summary">
                    <p>Total: <span id="cart-total">0.00</span></p>
                </div>
                <form onsubmit="handleCheckout(event)">
                    <input type="text" id="discount-code" placeholder="Discount Code (optional)">
                    <input type="number" id="customer-id" placeholder="Customer ID (optional)">
                    <select id="payment-method" required>
                        <option value="cash">Cash</option>
                        <option value="credit_card">Credit Card</option>
                    </select>
                    <button type="submit">Checkout</button>
                </form>
            </div>
        </div>
    `;
}

async function loadPosData() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        posProducts = await response.json();
        
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = posProducts.map(p => `
            <div class="product-card" onclick="addToCart(${p.id})">
                <strong>${p.name}</strong>
                <span>$${p.price.toFixed(2)}</span>
                <small>Stock: ${p.quantity}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading POS data:', error);
        document.querySelector('.product-grid').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function addToCart(productId) {
    const product = posProducts.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    renderCart();
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Cart is empty</p>';
        cartTotalEl.textContent = '0.00';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    }).join('');

    cartTotalEl.textContent = total.toFixed(2);
}

async function handleCheckout(event) {
    event.preventDefault();
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (!loggedInUserId) {
        alert('You must be logged in to perform a checkout.');
        showPage('login');
        return;
    }

    if (cart.length === 0) {
        alert('Cart is empty.');
        return;
    }

    const discountCode = document.getElementById('discount-code').value;
    const customerId = document.getElementById('customer-id').value;
    const paymentMethod = document.getElementById('payment-method').value;

    const saleData = {
        user_id: parseInt(loggedInUserId),
        customer_id: customerId ? parseInt(customerId) : null,
        payment_method: paymentMethod,
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
        discount_codes: discountCode ? [discountCode] : []
    };

    try {
        const response = await fetch(`${API_BASE_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Checkout failed: ${errorText}`);
        }

        const result = await response.json();
        alert(`Checkout successful! Sale ID: ${result.sale_id}`);
        cart = []; // Clear cart
        renderCart();
        loadPosData(); // Refresh product list to show updated stock
    } catch (error) {
        console.error('Checkout error:', error);
        alert(error.message);
    }
}

// --- Products Page ---

function getProductsPageHTML() {
    return `
        <div class="page-content">
            <h2>Manage Products</h2>
            <form onsubmit="handleCreateProduct(event)">
                <h3>Add New Product</h3>
                <input type="text" id="product-name" placeholder="Name" required>
                <input type="text" id="product-sku" placeholder="SKU" required>
                <input type="number" id="product-price" placeholder="Price" step="0.01" required>
                <input type="number" id="product-stock" placeholder="Initial Stock" required>
                <textarea id="product-description" placeholder="Description (optional)"></textarea>
                <button type="submit">Add Product</button>
            </form>
            <hr>
            <h3>Existing Products</h3>
            <table id="products-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Product rows will be inserted here -->
                </tbody>
            </table>
        </div>
    `;
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        
        const tableBody = document.querySelector('#products-table tbody');
        if (products && products.length > 0) {
            tableBody.innerHTML = products.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.sku}</td>
                    <td>${p.name}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>${p.quantity}</td>
                    <td><button class="secondary" onclick="handleDeleteProduct(${p.id})">Delete</button></td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="6">No products found.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.querySelector('#products-table tbody').innerHTML = `<tr><td colspan="6" class="error">${error.message}</td></tr>`;
    }
}

async function handleCreateProduct(event) {
    event.preventDefault();
    const product = {
        name: document.getElementById('product-name').value,
        sku: document.getElementById('product-sku').value,
        price: parseFloat(document.getElementById('product-price').value),
        quantity: parseInt(document.getElementById('product-stock').value),
        description: document.getElementById('product-description').value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create product: ${errorText}`);
        }
        
        alert('Product created successfully!');
        event.target.reset(); // Clear the form
        loadProducts(); // Refresh the list
    } catch (error) {
        console.error('Error creating product:', error);
        alert(error.message);
    }
}

// --- Customers Page ---

function getCustomersPageHTML() {
    return `
        <div class="page-content">
            <h2>Manage Customers</h2>
            <form onsubmit="handleCreateCustomer(event)">
                <h3>Add New Customer</h3>
                <input type="text" id="customer-name" placeholder="Name" required>
                <input type="text" id="customer-phone" placeholder="Phone Number">
                <input type="email" id="customer-email" placeholder="Email">
                <input type="text" id="customer-address" placeholder="Address">
                <button type="submit">Add Customer</button>
            </form>
            <hr>
            <h3>Existing Customers</h3>
            <table id="customers-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
}

async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE_URL}/customers`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        const customers = await response.json();
        
        const tableBody = document.querySelector('#customers-table tbody');
        if (customers && customers.length > 0) {
            tableBody.innerHTML = customers.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.phone_number || ''}</td>
                    <td>${c.email || ''}</td>
                    <td><button class="secondary" onclick="handleDeleteCustomer(${c.id})">Delete</button></td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="5">No customers found.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        document.querySelector('#customers-table tbody').innerHTML = `<tr><td colspan="5" class="error">${error.message}</td></tr>`;
    }
}

async function handleCreateCustomer(event) {
    event.preventDefault();
    const customer = {
        name: document.getElementById('customer-name').value,
        phone_number: document.getElementById('customer-phone').value,
        email: document.getElementById('customer-email').value,
        address: document.getElementById('customer-address').value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
        });
        if (!response.ok) throw new Error(await response.text());
        alert('Customer created successfully!');
        event.target.reset();
        loadCustomers();
    } catch (error) {
        console.error('Error creating customer:', error);
        alert(`Failed to create customer: ${error.message}`);
    }
}

async function handleDeleteCustomer(customerId) {
    if (!confirm(`Are you sure you want to delete customer ID ${customerId}?`)) return;
    try {
        const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(await response.text());
        alert('Customer deleted successfully!');
        loadCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
        alert(`Failed to delete customer: ${error.message}`);
    }
}


// --- Reports Page ---

function getReportsPageHTML() {
    return `
        <div class="page-content">
            <h2>Sales Report</h2>
            <form onsubmit="loadReport(event)">
                <label for="start-date">Start Date:</label>
                <input type="date" id="start-date">
                <label for="end-date">End Date:</label>
                <input type="date" id="end-date">
                <button type="submit">Generate Report</button>
            </form>
            <div id="report-results"></div>
        </div>
    `;
}

async function loadReport(event) {
    if(event) event.preventDefault();
    
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    
    let query = '';
    if (startDate && endDate) {
        query = `?start_date=${startDate}&end_date=${endDate}`;
    }

    const reportContainer = document.getElementById('report-results');
    reportContainer.innerHTML = '<p>Loading report...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/reports/sales${query}`);
        if (!response.ok) throw new Error(await response.text());
        const report = await response.json();

        reportContainer.innerHTML = `
            <h3>Report for ${report.start_date.split(' ')[0]} to ${report.end_date.split(' ')[0]}</h3>
            <p><strong>Total Revenue:</strong> $${report.total_revenue.toFixed(2)}</p>
            <p><strong>Total Transactions:</strong> ${report.total_transactions}</p>
            <h4>Top Selling Products</h4>
            <table>
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Quantity Sold</th><th>Total Value</th></tr>
                </thead>
                <tbody>
                    ${report.top_selling_products.map(p => `
                        <tr>
                            <td>${p.product_id}</td>
                            <td>${p.product_name}</td>
                            <td>${p.total_sold}</td>
                            <td>$${p.total_value.toFixed(2)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4">No sales in this period.</td></tr>'}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading report:', error);
        reportContainer.innerHTML = `<p class="error">Failed to load report: ${error.message}</p>`;
    }
}

async function handleDeleteProduct(productId) {
    if (!confirm(`Are you sure you want to delete product ID ${productId}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete product: ${errorText}`);
        }

        alert('Product deleted successfully!');
        loadProducts(); // Refresh the list
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.message);
    }
}