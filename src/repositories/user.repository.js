'use strict';
const { Op }      = require('sequelize');
const Base        = require('./base.repository');
const { User }    = require('../models');
const { paginate }= require('../utils/pagination');

class UserRepository extends Base {
  constructor() { super(User); }

  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async list(query = {}) {
    const { page, limit, offset } = paginate(query);
    const where = {};
    if (query.role)   where.role   = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
      ];
    }
    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      attributes: { exclude: ['passwordHash', 'mfaSecret'] },
      order:      [['createdAt', 'DESC']],
    });
    return { items: rows, total: count, page, limit };
  }
}

module.exports = new UserRepository();
