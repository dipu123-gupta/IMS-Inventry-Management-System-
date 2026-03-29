const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.setup2FA = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select('+twoFactorSecret');
    
    // Generate secret if not exists
    if (!user.twoFactorSecret) {
      const secret = authenticator.generateSecret();
      user = await User.findByIdAndUpdate(
        req.user._id, 
        { twoFactorSecret: secret }, 
        { new: true }
      ).select('+twoFactorSecret');
    }

    const otpauth = generateURI({ 
      issuer: 'IMS-SaaS', 
      label: user.email, 
      secret: user.twoFactorSecret 
    });
    
    const qrImageUrl = await qrcode.toDataURL(otpauth);

    res.json({
      qrCode: qrImageUrl,
      enabled: user.isTwoFactorEnabled
    });
  } catch (err) {
    logger.error('Error setting up 2FA:', err);
    res.status(500).json({ message: 'Error setting up 2FA' });
  }
};

exports.verify2FA = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    
    const { valid } = verifySync({ token, secret: user.twoFactorSecret });
    
    if (valid) {
      user.isTwoFactorEnabled = true;
      await user.save();
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ message: 'Invalid 2FA token' });
    }
  } catch (err) {
    logger.error('Verification error during 2FA setup:', err);
    res.status(500).json({ message: 'Verification error' });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    logger.error('Error disabling 2FA:', err);
    res.status(500).json({ message: 'Error disabling 2FA' });
  }
};

