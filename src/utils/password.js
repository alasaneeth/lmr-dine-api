'use strict';
const bcrypt = require('bcryptjs');
const cfg    = require('../config/env');

const hash    = (plain)          => bcrypt.hash(plain, cfg.bcrypt.rounds);
const compare = (plain, hashed)  => bcrypt.compare(plain, hashed);

module.exports = { hash, compare };
