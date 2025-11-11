const { getCollection } = require('../utils/database')
const bcrypt = require('bcryptjs')
const { ObjectId } = require('mongodb')

class User {
  constructor(userData) {
    this.email = userData.email
    this.password = userData.password // Will be hashed
    this.role = userData.role || 'user' // 'admin' or 'user'
    this.name = userData.name || ''
    this.isActive = userData.isActive !== undefined ? userData.isActive : true
    this.createdAt = userData.createdAt || new Date()
    this.updatedAt = userData.updatedAt || new Date()
    this.lastLogin = userData.lastLogin || null
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(12)
      this.password = await bcrypt.hash(this.password, salt)
    }
  }

  // Validate password
  async validatePassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password)
  }

  // Static method to validate password
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }

  // Create new user
  static async create(userData) {
    const usersCollection = await getCollection('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: userData.email.toLowerCase() })
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Create new user instance
    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
    })

    // Hash password
    await user.hashPassword()

    // Insert user into database
    const result = await usersCollection.insertOne({
      email: user.email,
      password: user.password,
      role: user.role,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    })

    // Return user without password
    const { password: _password, ...userWithoutPassword } = user
    return {
      _id: result.insertedId,
      ...userWithoutPassword,
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const usersCollection = await getCollection('users')
    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
      isActive: true,
    })
    return user
  }

  // Find user by ID
  static async findById(id) {
    const usersCollection = await getCollection('users')
    const user = await usersCollection.findOne({
      _id: new ObjectId(id),
      isActive: true,
    })
    return user
  }

  // Update last login
  static async updateLastLogin(userId) {
    const usersCollection = await getCollection('users')
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      }
    )
  }

  // Check if user is admin
  static isAdmin(user) {
    return user && user.role === 'admin'
  }

  // Get all users (admin only)
  static async findAll(filters = {}) {
    const usersCollection = await getCollection('users')
    const users = await usersCollection
      .find(filters)
      .project({ password: 0 }) // Exclude password field
      .toArray()
    return users
  }

  // Update user role (admin only)
  static async updateRole(userId, role) {
    const usersCollection = await getCollection('users')
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    )
    return result.matchedCount > 0
  }
}

module.exports = User
