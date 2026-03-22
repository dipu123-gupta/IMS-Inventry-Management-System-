const axios = require('axios');

async function loginAndGetCustomers() {
    try {
        const loginRes = await axios.post('http://localhost:5001/api/v1/auth/login', {
            email: 'tempadmin@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token retrieved');

        try {
            const createCustomerRes = await axios.post('http://localhost:5001/api/v1/customers', {
                name: 'Test Customer',
                email: 'test@customer.com',
                phone: '1234567890'
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Customer created:', createCustomerRes.data.customer._id);
        } catch (err) {
            console.log('Error creating customer:', err.message);
            if (err.response) console.log('Response data:', err.response.data);
        }
    } catch (err) {
        console.error('Login failed:', err.message);
        if (err.response) console.log('Login response data:', err.response.data);
    }
}

loginAndGetCustomers();
