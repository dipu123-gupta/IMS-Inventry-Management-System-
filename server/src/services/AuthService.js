const jwt = require('jsonwebtoken');
const { generateSecret, generateURI, verifySync } = require('otplib');
const config = require('../../config/env');
const UserRepository = require('../repositories/UserRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRE });
  }

  async register(data) {
    const { name, email, password, role, orgName } = data;

    const existingUser = await UserRepository.findOne({ email });
    if (existingUser) {
      const error = new Error('User already exists with this email');
      error.statusCode = 400;
      throw error;
    }

    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId();
    const organizationId = new mongoose.Types.ObjectId();

    // First user registering is always admin — ignore user-supplied role
    const user = await UserRepository.create({
      _id: userId,
      name,
      email,
      password,
      role: 'admin',
      organization: organizationId
    });

    const organizationName = orgName || `${name}'s Organization`;
    const organization = await OrganizationRepository.create({
      _id: organizationId,
      name: organizationName,
      owner: userId
    });

    const token = this.generateToken(user._id);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: {
        _id: organization._id,
        name: organization.name
      },
      token,
    };
  }

  async login(email, password) {
    const user = await UserRepository.findByEmailWithPassword(email);
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    if (user.isTwoFactorEnabled) {
      return {
        twoFactorRequired: true,
        userId: user._id, 
        message: 'Please provide 2FA token'
      };
    }

    const token = this.generateToken(user._id);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      token,
    };
  }

  async verifyLogin2FA(userId, otpToken) {
    const user = await UserRepository.findByIdWithSecret(userId);
    if (!user || !user.isTwoFactorEnabled) {
      const error = new Error('2FA not enabled or user not found');
      error.statusCode = 400;
      throw error;
    }
    const { valid } = verifySync({ token: otpToken, secret: user.twoFactorSecret });
    if (!valid) {
      const error = new Error('Invalid 2FA token');
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user._id);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      token,
    };
  }

  async getMe(userId) {
    const user = await UserRepository.findByIdWithOrg(userId);
    return user;
  }
}

module.exports = new AuthService();
