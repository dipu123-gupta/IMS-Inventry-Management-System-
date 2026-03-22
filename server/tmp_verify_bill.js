const axios = require('axios');

async function verifyBill() {
    try {
        // 1. Login to get token
        const loginRes = await axios.post('http://localhost:5001/api/v1/auth/login', {
            email: 'tempadmin@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Create Bill with standard YYYY-MM-DD date
        const vendorId = '69bc9bfca53da9fa54dcaf13'; // Rakesh Mehta
        const productId = '69bc9bfca53da9fa54dcaf10';

        const billRes = await axios.post('http://localhost:5001/api/v1/bills', {
            vendor: vendorId,
            dueDate: '2026-04-20', // Standard YYYY-MM-DD string
            items: [
                {
                    product: productId,
                    quantity: 5,
                    price: 599
                }
            ],
            notes: 'Test bill with standard date'
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Bill created successfully:', billRes.data.billNumber);
        process.exit(0);
    } catch (err) {
        console.error('Bill creation failed:', err.message);
        if (err.response) console.log('Response data:', err.response.data);
        process.exit(1);
    }
}

verifyBill();
