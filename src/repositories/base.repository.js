'use strict';
const AppError = require('../errors/AppError');

/**
 * BaseRepository – provides generic CRUD methods.
 * All domain repositories extend this class.
 */
class BaseRepository {
  constructor(Model) {
    this.Model = Model;
  }

  async findAll(options = {}) {
    return this.Model.findAndCountAll(options);
  }

  async findById(id, options = {}) {
    const record = await this.Model.findByPk(id, options);
    if (!record) throw AppError.notFound(`${this.Model.name} #${id} not found`);
    return record;
  }

  async findOne(where, options = {}) {
    return this.Model.findOne({ where, ...options });
  }

  async create(data, options = {}) {
    return this.Model.create(data, options);
  }

  async update(id, data, options = {}) {
    const record = await this.findById(id);
    return record.update(data, options);
  }

  async destroy(id) {
    const record = await this.findById(id);
    await record.destroy();
    return true;
  }

  async count(where = {}) {
    return this.Model.count({ where });
  }
}

module.exports = BaseRepository;
