'use strict';
const { Op }           = require('sequelize');
const BaseRepository   = require('./base.repository');
const { User }         = require('../models');

class UserRepository extends BaseRepository {
  constructor() { super(User, 'User'); }

  async findByEmail(email) {
    return User.scope('withPassword').findOne({ where: { email } });
  }

  async findByEmailPublic(email) {
    return User.findOne({ where: { email } });
  }

  async findPaginated({ offset, limit, search, role, status }) {
    const where = {};
    if (role)   where.role   = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    return User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  async updateLastLogin(id) {
    return User.update({ last_login_at: new Date() }, { where: { id } });
  }
}

// Singleton instance (Singleton pattern)
module.exports = new UserRepository();
