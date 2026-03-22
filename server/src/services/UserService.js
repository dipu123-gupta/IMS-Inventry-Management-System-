const UserRepository = require('../repositories/UserRepository');

class UserService {
  async getUsers(organization) {
    const users = await UserRepository.find({ organization });
    return { success: true, count: users.length, users };
  }

  async addUser(data, organization) {
    const { name, email, password, role } = data;

    const existingUser = await UserRepository.findOne({ email });
    if (existingUser) {
      const error = new Error('User already exists with this email');
      error.statusCode = 400;
      throw error;
    }

    const user = await UserRepository.create({
      name,
      email,
      password,
      role: role || 'staff',
      organization
    });

    return { success: true, user };
  }

  async deleteUser(id, organization, currentUserId) {
    const user = await UserRepository.findOne({ _id: id, organization });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user._id.toString() === currentUserId.toString()) {
      const error = new Error('You cannot delete yourself');
      error.statusCode = 400;
      throw error;
    }

    await user.deleteOne();
    return { success: true, message: 'User removed' };
  }
}

module.exports = new UserService();
