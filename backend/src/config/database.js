/**
 * Database configuration for Subnest backend
 * 
 * This file handles the database connection and configuration
 * using Knex.js as the SQL query builder.
 */

const knex = require('knex');
const logger = require('../utils/logger');

// Database configuration
const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'subnest',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../migrations',
  },
  seeds: {
    directory: '../seeds',
  },
};

// Create database instance
const db = knex(config);

/**
 * Connect to the database
 * @returns {Promise} Promise that resolves when connected
 */
const connect = async () => {
  try {
    await db.raw('SELECT 1');
    return Promise.resolve();
  } catch (error) {
    logger.error('Database connection error:', error);
    return Promise.reject(error);
  }
};

/**
 * Close the database connection
 * @returns {Promise} Promise that resolves when disconnected
 */
const disconnect = async () => {
  try {
    await db.destroy();
    return Promise.resolve();
  } catch (error) {
    logger.error('Database disconnection error:', error);
    return Promise.reject(error);
  }
};

module.exports = {
  db,
  connect,
  disconnect,
};
