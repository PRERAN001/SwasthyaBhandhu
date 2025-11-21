<<<<<<< HEAD
/**
 * SwasthyaBhandhu - Pharmacist Dashboard
 * 
 * NOTE: All data is static and stored in localStorage.
 * In production, replace with API calls to backend server.
 */

// Global variables
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = requireAuth(['pharmacist']);
    if (!currentUser) return;

    // Display user name
    document.getElementById('user-name').textContent = currentUser.name;

    // Initialize tabs
    initializeTabs('pharmacist-tabs');

    // Load data
    loadProfile();
    loadInventory();
    loadPrescriptions();
    loadOrders();
    loadFeedback();
    loadAnalytics();

    // Initialize search
    initializeSearch();
});

// ============== PROFILE MANAGEMENT ==============

function loadProfile() {
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-license').value = currentUser.licenseNo || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-pharmacy').value = currentUser.pharmacyName || '';
    document.getElementById('profile-experience').value = currentUser.experience || '';
}

function saveProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const updates = {
        name: form.name.value,
        licenseNo: form.licenseNo.value,
        email: form.email.value,
        phone: form.phone.value,
        pharmacyName: form.pharmacyName.value,
        experience: form.experience.value
    };

    if (updateUser(currentUser.id, updates)) {
        currentUser = { ...currentUser, ...updates };
        localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(currentUser));
        showAlert('Profile updated successfully!', 'success');
    } else {
        showAlert('Failed to update profile', 'error');
    }

    return false;
}

// ============== MEDICINE INVENTORY ==============

function loadInventory() {
    const inventory = getInventory();
    const tbody = document.getElementById('inventory-list');
    
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No medicines in inventory</td></tr>';
        return;
    }

    tbody.innerHTML = inventory.map(med => {
        const stockStatus = getStockStatus(med.stock);
        const expiryStatus = getExpiryStatus(med.expiry);
        
        return `
            <tr>
                <td>${med.name}</td>
                <td class="${stockStatus.class}">${med.stock} ${stockStatus.text}</td>
                <td>₹${med.price}</td>
                <td class="${expiryStatus.class}">${formatDate(med.expiry)}</td>
                <td><span class="badge badge-${stockStatus.badge}">${stockStatus.label}</span></td>
                <td>
                    <button class="btn btn-outline" onclick="editMedicine('${med.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteMedicine('${med.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    // Populate medicine select for orders
    const medicineSelect = document.getElementById('medicine-select');
    medicineSelect.innerHTML = '<option value="">Select Medicine</option>' + 
        inventory.map(m => `<option value="${m.id}">${m.name} (Stock: ${m.stock})</option>`).join('');
}

function getInventory() {
    return JSON.parse(localStorage.getItem(StorageKeys.INVENTORY) || '[]');
}

function getStockStatus(stock) {
    if (stock === 0) {
        return { class: 'low-stock', text: '(Out of Stock)', label: 'Out of Stock', badge: 'danger' };
    } else if (stock < 50) {
        return { class: 'low-stock', text: '(Low Stock)', label: 'Low Stock', badge: 'warning' };
    }
    return { class: '', text: '', label: 'In Stock', badge: 'success' };
}

function getExpiryStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
        return { class: 'low-stock', text: '(Expired)' };
    } else if (daysUntilExpiry < 30) {
        return { class: 'expiring-soon', text: '(Expiring Soon)' };
    }
    return { class: '', text: '' };
}

function addMedicine(event) {
    event.preventDefault();
    
    const form = event.target;
    const medicine = {
        id: generateId('MED'),
        name: form.name.value,
        stock: parseInt(form.stock.value),
        price: parseFloat(form.price.value),
        expiry: form.expiry.value,
        description: form.description.value,
        addedBy: currentUser.id,
        addedDate: new Date().toISOString()
    };

    const inventory = getInventory();
    inventory.push(medicine);
    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));

    showAlert('Medicine added successfully!', 'success');
    closeModal('add-medicine-modal');
    form.reset();
    loadInventory();
    loadAnalytics();

    return false;
}

function editMedicine(id) {
    const inventory = getInventory();
    const medicine = inventory.find(m => m.id === id);
    
    if (!medicine) return;

    document.getElementById('edit-medicine-id').value = medicine.id;
    document.getElementById('edit-medicine-name').value = medicine.name;
    document.getElementById('edit-medicine-stock').value = medicine.stock;
    document.getElementById('edit-medicine-price').value = medicine.price;
    document.getElementById('edit-medicine-expiry').value = medicine.expiry;
    
    openModal('edit-medicine-modal');
}

function updateMedicine(event) {
    event.preventDefault();
    
    const form = event.target;
    const id = form.id.value;
    
    const inventory = getInventory();
    const index = inventory.findIndex(m => m.id === id);
    
    if (index === -1) return false;

    inventory[index] = {
        ...inventory[index],
        name: form.name.value,
        stock: parseInt(form.stock.value),
        price: parseFloat(form.price.value),
        expiry: form.expiry.value,
        updatedDate: new Date().toISOString()
    };

    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));
    
    showAlert('Medicine updated successfully!', 'success');
    closeModal('edit-medicine-modal');
    loadInventory();
    loadAnalytics();

    return false;
}

function deleteMedicine(id) {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    
    let inventory = getInventory();
    inventory = inventory.filter(m => m.id !== id);
    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));
    
    showAlert('Medicine deleted', 'success');
    loadInventory();
    loadAnalytics();
}

function initializeSearch() {
    const searchInput = document.getElementById('medicine-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#inventory-list tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// ============== PRESCRIPTIONS ==============

function loadPrescriptions() {
    const prescriptions = JSON.parse(localStorage.getItem(StorageKeys.PRESCRIPTIONS) || '[]');
    const container = document.getElementById('prescriptions-list');
    
    if (prescriptions.length === 0) {
        container.innerHTML = '<p>No prescriptions available</p>';
        return;
    }

    container.innerHTML = prescriptions.map(rx => `
        <div class="prescription-card">
            <div class="order-header">
                <div>
                    <h4>Prescription #${rx.id}</h4>
                    <p><strong>Doctor:</strong> ${rx.doctorName}</p>
                    <p><strong>Date:</strong> ${formatDate(rx.date)}</p>
                </div>
                <button class="btn btn-primary" onclick="fulfillPrescription('${rx.id}')">Fulfill Order</button>
            </div>
            <h5>Medicines:</h5>
            <ul class="medicine-list">
                ${rx.medicines.map(med => `
                    <li>${med.name} - ${med.dosage} (${med.frequency} for ${med.duration})</li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

function fulfillPrescription(id) {
    showAlert('Prescription fulfilled and order created', 'success');
    // In production, create actual order and update inventory
}

// ============== ORDERS ==============

function loadOrders() {
    const orders = getOrders();
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders available</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h4>Order #${order.id}</h4>
                    <p><strong>Patient:</strong> ${order.patientName}</p>
                    <p><strong>Date:</strong> ${formatDateTime(order.date)}</p>
                </div>
                <span class="badge badge-${getOrderStatusBadge(order.status)}">${order.status}</span>
            </div>
            <p><strong>Medicine:</strong> ${order.medicineName}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Total:</strong> ₹${order.total}</p>
            ${order.status === 'pending' ? `
                <button class="btn btn-secondary mt-2" onclick="completeOrder('${order.id}')">Mark as Complete</button>
            ` : ''}
        </div>
    `).join('');

    // Load patients for order creation
    const patients = getAllUsers().filter(u => u.role === 'patient');
    const patientSelect = document.getElementById('patient-select');
    patientSelect.innerHTML = '<option value="">Select Patient</option>' + 
        patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function getOrders() {
    // Static demo orders
    const orders = JSON.parse(localStorage.getItem('swasthya_orders') || '[]');
    
    if (orders.length === 0) {
        // Create demo order
        const demoOrder = {
            id: 'ORD001',
            patientId: 'P001',
            patientName: 'Amit Patel',
            medicineId: 'M001',
            medicineName: 'Paracetamol 500mg',
            quantity: 20,
            total: 200,
            status: 'pending',
            date: new Date().toISOString()
        };
        orders.push(demoOrder);
        localStorage.setItem('swasthya_orders', JSON.stringify(orders));
    }
    
    return orders;
}

function createOrder(event) {
    event.preventDefault();
    
    const form = event.target;
    const patients = getAllUsers();
    const patient = patients.find(p => p.id === form.patientId.value);
    const inventory = getInventory();
    const medicine = inventory.find(m => m.id === form.medicineId.value);
    const quantity = parseInt(form.quantity.value);
    
    if (!medicine || !patient) {
        showAlert('Invalid selection', 'error');
        return false;
    }

    if (medicine.stock < quantity) {
        showAlert('Insufficient stock', 'error');
        return false;
    }

    const order = {
        id: generateId('ORD'),
        patientId: patient.id,
        patientName: patient.name,
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: quantity,
        total: medicine.price * quantity,
        status: 'pending',
        date: new Date().toISOString()
    };

    const orders = JSON.parse(localStorage.getItem('swasthya_orders') || '[]');
    orders.push(order);
    localStorage.setItem('swasthya_orders', JSON.stringify(orders));

    // Update inventory
    medicine.stock -= quantity;
    const inventoryIndex = inventory.findIndex(m => m.id === medicine.id);
    inventory[inventoryIndex] = medicine;
    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));

    showAlert('Order created successfully!', 'success');
    closeModal('create-order-modal');
    form.reset();
    loadOrders();
    loadInventory();
    loadAnalytics();

    return false;
}

function completeOrder(id) {
    const orders = JSON.parse(localStorage.getItem('swasthya_orders') || '[]');
    const index = orders.findIndex(o => o.id === id);
    
    if (index !== -1) {
        orders[index].status = 'completed';
        localStorage.setItem('swasthya_orders', JSON.stringify(orders));
        showAlert('Order completed', 'success');
        loadOrders();
        loadAnalytics();
    }
}

function getOrderStatusBadge(status) {
    const badges = {
        'pending': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return badges[status] || 'info';
}

// ============== FEEDBACK ==============

function loadFeedback() {
    const feedbacks = JSON.parse(localStorage.getItem('swasthya_feedbacks') || '[]')
        .filter(fb => fb.type === 'pharmacist');
    
    const container = document.getElementById('feedback-list');
    
    if (feedbacks.length === 0) {
        container.innerHTML = '<p>No feedback received yet</p>';
        return;
    }

    container.innerHTML = feedbacks.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <strong>${fb.patientName}</strong>
                <span class="feedback-rating">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
            </div>
            <p>${fb.comments}</p>
            <p class="text-secondary" style="font-size: 0.75rem;">${formatDate(fb.date)}</p>
        </div>
    `).join('');
}

// ============== ANALYTICS ==============

function loadAnalytics() {
    const inventory = getInventory();
    const orders = getOrders();
    
    const lowStockItems = inventory.filter(m => m.stock < 50);
    
    document.getElementById('total-medicines').textContent = inventory.length;
    document.getElementById('low-stock').textContent = lowStockItems.length;
    document.getElementById('total-orders').textContent = orders.length;
    
    // Expiring medicines
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringMedicines = inventory.filter(m => {
        const expiry = new Date(m.expiry);
        return expiry > today && expiry <= thirtyDaysLater;
    });
    
    const expiringContainer = document.getElementById('expiring-medicines');
    
    if (expiringMedicines.length === 0) {
        expiringContainer.innerHTML = '<p>No medicines expiring in the next 30 days</p>';
    } else {
        expiringContainer.innerHTML = expiringMedicines.map(med => `
            <div class="expiring-item">
                <p><strong>${med.name}</strong></p>
                <p>Expires: ${formatDate(med.expiry)} (${getDaysUntilExpiry(med.expiry)} days)</p>
                <p>Stock: ${med.stock}</p>
            </div>
        `).join('');
    }
}

function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
}
=======
/**
 * SwasthyaBhandhu - Pharmacist Dashboard
 * 
 * NOTE: All data is static and stored in localStorage.
 * In production, replace with API calls to backend server.
 */

// Global variables
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = requireAuth(['pharmacist']);
    if (!currentUser) return;

    // Display user name
    document.getElementById('user-name').textContent = currentUser.name;

    // Initialize tabs
    initializeTabs('pharmacist-tabs');

    // Load data
    loadProfile();
    loadInventory();
    loadPrescriptions();
    loadOrders();
    loadFeedback();
    loadAnalytics();

    // Initialize search
    initializeSearch();
});

// ============== PROFILE MANAGEMENT ==============

function loadProfile() {
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-license').value = currentUser.licenseNo || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-pharmacy').value = currentUser.pharmacyName || '';
    document.getElementById('profile-experience').value = currentUser.experience || '';
}

function saveProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const updates = {
        name: form.name.value,
        licenseNo: form.licenseNo.value,
        email: form.email.value,
        phone: form.phone.value,
        pharmacyName: form.pharmacyName.value,
        experience: form.experience.value
    };

    if (updateUser(currentUser.id, updates)) {
        currentUser = { ...currentUser, ...updates };
        localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(currentUser));
        showAlert('Profile updated successfully!', 'success');
    } else {
        showAlert('Failed to update profile', 'error');
    }

    return false;
}

// ============== MEDICINE INVENTORY ==============

function loadInventory() {
    const inventory = getInventory();
    const tbody = document.getElementById('inventory-list');
    
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No medicines in inventory</td></tr>';
        return;
    }

    tbody.innerHTML = inventory.map(med => {
        const stockStatus = getStockStatus(med.stock);
        const expiryStatus = getExpiryStatus(med.expiry);
        
        return `
            <tr>
                <td>${med.name}</td>
                <td class="${stockStatus.class}">${med.stock} ${stockStatus.text}</td>
                <td>₹${med.price}</td>
                <td class="${expiryStatus.class}">${formatDate(med.expiry)}</td>
                <td><span class="badge badge-${stockStatus.badge}">${stockStatus.label}</span></td>
                <td>
                    <button class="btn btn-outline" onclick="editMedicine('${med.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteMedicine('${med.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    // Populate medicine select for orders
    const medicineSelect = document.getElementById('medicine-select');
    medicineSelect.innerHTML = '<option value="">Select Medicine</option>' + 
        inventory.map(m => `<option value="${m.id}">${m.name} (Stock: ${m.stock})</option>`).join('');
}

function getInventory() {
    return JSON.parse(localStorage.getItem(StorageKeys.INVENTORY) || '[]');
}

function getStockStatus(stock) {
    if (stock === 0) {
        return { class: 'low-stock', text: '(Out of Stock)', label: 'Out of Stock', badge: 'danger' };
    } else if (stock < 50) {
        return { class: 'low-stock', text: '(Low Stock)', label: 'Low Stock', badge: 'warning' };
    }
    return { class: '', text: '', label: 'In Stock', badge: 'success' };
}

function getExpiryStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
        return { class: 'low-stock', text: '(Expired)' };
    } else if (daysUntilExpiry < 30) {
        return { class: 'expiring-soon', text: '(Expiring Soon)' };
    }
    return { class: '', text: '' };
}

function addMedicine(event) {
    event.preventDefault();
    
    const form = event.target;
    const medicine = {
        id: generateId('MED'),
        name: form.name.value,
        stock: parseInt(form.stock.value),
        price: parseFloat(form.price.value),
        expiry: form.expiry.value,
        description: form.description.value,
        addedBy: currentUser.id,
        addedDate: new Date().toISOString()
    };

    const inventory = getInventory();
    inventory.push(medicine);
    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));

    showAlert('Medicine added successfully!', 'success');
    closeModal('add-medicine-modal');
    form.reset();
    loadInventory();
    loadAnalytics();

    return false;
}

function editMedicine(id) {
    const inventory = getInventory();
    const medicine = inventory.find(m => m.id === id);
    
    if (!medicine) return;

    document.getElementById('edit-medicine-id').value = medicine.id;
    document.getElementById('edit-medicine-name').value = medicine.name;
    document.getElementById('edit-medicine-stock').value = medicine.stock;
    document.getElementById('edit-medicine-price').value = medicine.price;
    document.getElementById('edit-medicine-expiry').value = medicine.expiry;
    
    openModal('edit-medicine-modal');
}

function updateMedicine(event) {
    event.preventDefault();
    
    const form = event.target;
    const id = form.id.value;
    
    const inventory = getInventory();
    const index = inventory.findIndex(m => m.id === id);
    
    if (index === -1) return false;

    inventory[index] = {
        ...inventory[index],
        name: form.name.value,
        stock: parseInt(form.stock.value),
        price: parseFloat(form.price.value),
        expiry: form.expiry.value,
        updatedDate: new Date().toISOString()
    };

    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));
    
    showAlert('Medicine updated successfully!', 'success');
    closeModal('edit-medicine-modal');
    loadInventory();
    loadAnalytics();

    return false;
}

function deleteMedicine(id) {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    
    let inventory = getInventory();
    inventory = inventory.filter(m => m.id !== id);
    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));
    
    showAlert('Medicine deleted', 'success');
    loadInventory();
    loadAnalytics();
}

function initializeSearch() {
    const searchInput = document.getElementById('medicine-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#inventory-list tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// ============== PRESCRIPTIONS ==============

function loadPrescriptions() {
    const prescriptions = JSON.parse(localStorage.getItem(StorageKeys.PRESCRIPTIONS) || '[]');
    const container = document.getElementById('prescriptions-list');
    
    if (prescriptions.length === 0) {
        container.innerHTML = '<p>No prescriptions available</p>';
        return;
    }

    container.innerHTML = prescriptions.map(rx => `
        <div class="prescription-card">
            <div class="order-header">
                <div>
                    <h4>Prescription #${rx.id}</h4>
                    <p><strong>Doctor:</strong> ${rx.doctorName}</p>
                    <p><strong>Date:</strong> ${formatDate(rx.date)}</p>
                </div>
                <button class="btn btn-primary" onclick="fulfillPrescription('${rx.id}')">Fulfill Order</button>
            </div>
            <h5>Medicines:</h5>
            <ul class="medicine-list">
                ${rx.medicines.map(med => `
                    <li>${med.name} - ${med.dosage} (${med.frequency} for ${med.duration})</li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

function fulfillPrescription(id) {
    showAlert('Prescription fulfilled and order created', 'success');
    // In production, create actual order and update inventory
}

// ============== ORDERS ==============

function loadOrders() {
    const orders = getOrders();
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders available</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h4>Order #${order.id}</h4>
                    <p><strong>Patient:</strong> ${order.patientName}</p>
                    <p><strong>Date:</strong> ${formatDateTime(order.date)}</p>
                </div>
                <span class="badge badge-${getOrderStatusBadge(order.status)}">${order.status}</span>
            </div>
            <p><strong>Medicine:</strong> ${order.medicineName}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Total:</strong> ₹${order.total}</p>
            ${order.status === 'pending' ? `
                <button class="btn btn-secondary mt-2" onclick="completeOrder('${order.id}')">Mark as Complete</button>
            ` : ''}
        </div>
    `).join('');

    // Load patients for order creation
    const patients = getAllUsers().filter(u => u.role === 'patient');
    const patientSelect = document.getElementById('patient-select');
    patientSelect.innerHTML = '<option value="">Select Patient</option>' + 
        patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function getOrders() {
    // Static demo orders
    const orders = JSON.parse(localStorage.getItem('swasthya_orders') || '[]');
    
    if (orders.length === 0) {
        // Create demo order
        const demoOrder = {
            id: 'ORD001',
            patientId: 'P001',
            patientName: 'Amit Patel',
            medicineId: 'M001',
            medicineName: 'Paracetamol 500mg',
            quantity: 20,
            total: 200,
            status: 'pending',
            date: new Date().toISOString()
        };
        orders.push(demoOrder);
        localStorage.setItem('swasthya_orders', JSON.stringify(orders));
    }
    
    return orders;
}

function createOrder(event) {
    event.preventDefault();
    
    const form = event.target;
    const patients = getAllUsers();
    const patient = patients.find(p => p.id === form.patientId.value);
    const inventory = getInventory();
    const medicine = inventory.find(m => m.id === form.medicineId.value);
    const quantity = parseInt(form.quantity.value);
    
    if (!medicine || !patient) {
        showAlert('Invalid selection', 'error');
        return false;
    }

    if (medicine.stock < quantity) {
        showAlert('Insufficient stock', 'error');
        return false;
    }

    const order = {
        id: generateId('ORD'),
        patientId: patient.id,
        patientName: patient.name,
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: quantity,
        total: medicine.price * quantity,
        status: 'pending',
        date: new Date().toISOString()
    };

    const orders = JSON.parse(localStorage.getItem('swasthya_orders') || '[]');
    orders.push(order);
    localStorage.setItem('swasthya_orders', JSON.stringify(orders));

    // Update inventory
    medicine.stock -= quantity;
    const inventoryIndex = inventory.findIndex(m => m.id === medicine.id);
    inventory[inventoryIndex] = medicine;
    localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(inventory));

    showAlert('Order created successfully!', 'success');
    closeModal('create-order-modal');
    form.reset();
    loadOrders();
    loadInventory();
    loadAnalytics();

    return false;
}

function completeOrder(id) {
    const orders = JSON.parse(localStorage.getItem('swasthya_orders') || '[]');
    const index = orders.findIndex(o => o.id === id);
    
    if (index !== -1) {
        orders[index].status = 'completed';
        localStorage.setItem('swasthya_orders', JSON.stringify(orders));
        showAlert('Order completed', 'success');
        loadOrders();
        loadAnalytics();
    }
}

function getOrderStatusBadge(status) {
    const badges = {
        'pending': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return badges[status] || 'info';
}

// ============== FEEDBACK ==============

function loadFeedback() {
    const feedbacks = JSON.parse(localStorage.getItem('swasthya_feedbacks') || '[]')
        .filter(fb => fb.type === 'pharmacist');
    
    const container = document.getElementById('feedback-list');
    
    if (feedbacks.length === 0) {
        container.innerHTML = '<p>No feedback received yet</p>';
        return;
    }

    container.innerHTML = feedbacks.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <strong>${fb.patientName}</strong>
                <span class="feedback-rating">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
            </div>
            <p>${fb.comments}</p>
            <p class="text-secondary" style="font-size: 0.75rem;">${formatDate(fb.date)}</p>
        </div>
    `).join('');
}

// ============== ANALYTICS ==============

function loadAnalytics() {
    const inventory = getInventory();
    const orders = getOrders();
    
    const lowStockItems = inventory.filter(m => m.stock < 50);
    
    document.getElementById('total-medicines').textContent = inventory.length;
    document.getElementById('low-stock').textContent = lowStockItems.length;
    document.getElementById('total-orders').textContent = orders.length;
    
    // Expiring medicines
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringMedicines = inventory.filter(m => {
        const expiry = new Date(m.expiry);
        return expiry > today && expiry <= thirtyDaysLater;
    });
    
    const expiringContainer = document.getElementById('expiring-medicines');
    
    if (expiringMedicines.length === 0) {
        expiringContainer.innerHTML = '<p>No medicines expiring in the next 30 days</p>';
    } else {
        expiringContainer.innerHTML = expiringMedicines.map(med => `
            <div class="expiring-item">
                <p><strong>${med.name}</strong></p>
                <p>Expires: ${formatDate(med.expiry)} (${getDaysUntilExpiry(med.expiry)} days)</p>
                <p>Stock: ${med.stock}</p>
            </div>
        `).join('');
    }
}

function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
}
>>>>>>> 5077bc9c683a2a0fb8a849ec2e6a1ee90d73b6ad
