const otplib = require('otplib');
const secret = otplib.generateSecret();
const uri = otplib.generateURI({ secret, issuer: 'IMS', label: 'user@example.com' });
console.log('URI:', uri);
const token = otplib.generateSync({ secret });
const isValid = otplib.verifySync({ token, secret });
console.log('Token:', token, 'IsValid:', isValid);
