/**
 * Logger utility for Subnest backend
 * 
 * This file configures Winston logger for application-wide logging
 * with different log levels and formats.
 */

const winston = require('winston');
const { format, transports } = winston;

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'subnest-api' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with level 'info' and below to 'combined.log'
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  );
}

module.exports = logger;
