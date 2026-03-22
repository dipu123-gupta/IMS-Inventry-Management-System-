const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Cleanup
        await User.deleteOne({ email: 'tempadmin@test.com' });
        await Organization.deleteOne({ name: 'Test Org' });

        // Create Admin User first with placeholder org
        const placeholderOrgId = new mongoose.Types.ObjectId();
        const user = await User.create({
            name: 'Temp Admin',
            email: 'tempadmin@test.com',
            password: 'password123',
            role: 'admin',
            organization: placeholderOrgId
        });
        console.log('User created:', user._id);

        // Create Organization with user as owner
        const org = await Organization.create({
            name: 'Test Org',
            owner: user._id,
            subscription: {
                plan: 'enterprise',
                status: 'active'
            }
        });
        console.log('Org created:', org._id);

        // Update user with org
        user.organization = org._id;
        await user.save();

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createAdmin();
