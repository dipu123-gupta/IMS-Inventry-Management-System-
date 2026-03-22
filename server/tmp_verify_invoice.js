const axios = require('axios');

async function verifyInvoiceFix() {
    try {
        // 1. Login to get token
        const loginRes = await axios.post('http://localhost:5001/api/v1/auth/login', {
            email: 'tempadmin@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Create Invoice
        const customerId = '69bcfa53da9fa54dcaf1013d';
        const orderId = '69bcd90ed3bd0357e9d53205';

        const invoiceRes = await axios.post('http://localhost:5001/api/v1/invoices', {
            customer: customerId,
            salesOrder: orderId,
            dueDate: '2026-04-01',
            items: [
                {
                    product: '69bc9bfca53da9fa54dcaf10', // From previous product creation
                    quantity: 50,
                    price: 599
                }
            ],
            notes: 'Test invoice'
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Invoice created successfully:', invoiceRes.data.invoice.invoiceNumber);
        console.log('Subtotal:', invoiceRes.data.invoice.subtotal);
        console.log('Total Amount:', invoiceRes.data.invoice.totalAmount);
        
        process.exit(0);
    } catch (err) {
        console.error('Invoice creation failed:', err.message);
        if (err.response) console.log('Response data:', err.response.data);
        process.exit(1);
    }
}

verifyInvoiceFix();
