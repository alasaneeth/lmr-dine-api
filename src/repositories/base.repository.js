'use strict';
const { NotFoundError } = require('../utils/errors');

/**
 * BaseRepository
 *
 * Provides generic, reusable data-access methods backed by a Sequelize model.
 * All domain-specific repositories extend this class and may override or
 * augment its methods.
 *
 * Design: Repository Pattern + Dependency Injection via constructor.
 */
class BaseRepository {
  /**
   * @param {import('sequelize').ModelStatic} model  – Sequelize model class
   * @param {string}                          label  – human-readable resource name (for errors)
   */
  constructor(model, label) {
    this.model = model;
    this.label = label;
  }

  /** Return all records matching where clause (no pagination). */
  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  /** Paginated findAll. Returns { rows, count }. */
  async findAndCountAll(options = {}) {
    return this.model.findAndCountAll(options);
  }

  /** Find one record by primary key. Throws NotFoundError if missing. */
  async findById(id, options = {}) {
    const record = await this.model.findByPk(id, options);
    if (!record) throw new NotFoundError(this.label);
    return record;
  }

  /** Find one record matching where clause or throw NotFoundError. */
  async findOne(options = {}) {
    const record = await this.model.findOne(options);
    if (!record) throw new NotFoundError(this.label);
    return record;
  }

  /** Find one or return null (no throw). */
  async findOneOrNull(options = {}) {
    return this.model.findOne(options);
  }

  /** Create a new record. */
  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  /** Update record(s) matching where clause. Returns [affectedCount]. */
  async update(data, options = {}) {
    return this.model.update(data, options);
  }

  /** Update a specific record by id. Returns the updated instance. */
  async updateById(id, data, options = {}) {
    const record = await this.findById(id);
    await record.update(data, options);
    return record;
  }

  /** Soft-delete by id (sets deleted_at via Sequelize paranoid). */
  async deleteById(id) {
    const record = await this.findById(id);
    await record.destroy();
    return record;
  }

  /** Hard-delete by where clause (bypasses paranoid). */
  async hardDelete(options = {}) {
    return this.model.destroy({ ...options, force: true });
  }

  /** Count records matching options. */
  async count(options = {}) {
    return this.model.count(options);
  }

  /** Check if record exists. */
  async exists(options = {}) {
    const count = await this.model.count(options);
    return count > 0;
  }

  /**
   * Execute a function inside a Sequelize transaction.
   * Pass the transaction to all nested repo calls via options.transaction.
   *
   * @example
   *   await repo.transaction(async (t) => {
   *     await repo.create(data, { transaction: t });
   *     await otherRepo.updateById(id, data2, { transaction: t });
   *   });
   */
  async transaction(fn) {
    return this.model.sequelize.transaction(fn);
  }
}

module.exports = BaseRepository;
