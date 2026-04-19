'use strict';
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const cfg  = require('../config/env');

const { combine, timestamp, errors, json, colorize, printf } = format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack ? `[${ts}] ${level}: ${message}\n${stack}` : `[${ts}] ${level}: ${message}`
  )
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logTransports = [new transports.Console()];

if (cfg.env === 'production') {
  const fileTransport = new transports.DailyRotateFile({
    dirname:       path.join(cfg.log.dir),
    filename:      'rms-%DATE%.log',
    datePattern:   'YYYY-MM-DD',
    maxSize:       '20m',
    maxFiles:      '14d',
    zippedArchive: true,
  });
  logTransports.push(fileTransport);
}

const logger = createLogger({
  level:  cfg.log.level,
  format: cfg.env === 'production' ? prodFormat : devFormat,
  transports: logTransports,
  exitOnError: false,
});

module.exports = logger;
