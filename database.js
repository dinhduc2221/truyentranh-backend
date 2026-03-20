// database.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const hasManualDbConfig = Boolean(
  process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME
);

const dbName = hasManualDbConfig
  ? process.env.DB_NAME
  : process.env.MYSQLDATABASE || process.env.DB_NAME;
const dbUser = hasManualDbConfig
  ? process.env.DB_USER
  : process.env.MYSQLUSER || process.env.DB_USER;
const dbPass = hasManualDbConfig
  ? process.env.DB_PASS
  : process.env.MYSQLPASSWORD || process.env.DB_PASS;
const dbHost = hasManualDbConfig
  ? process.env.DB_HOST
  : process.env.MYSQLHOST || process.env.DB_HOST;
const dbPort = Number(
  hasManualDbConfig
    ? process.env.DB_PORT || 3306
    : process.env.MYSQLPORT || process.env.DB_PORT || 3306
);
const connectionUrl = hasManualDbConfig
  ? process.env.DATABASE_URL
  : process.env.DATABASE_URL || process.env.MYSQL_URL;

const baseOptions = {
  dialect: "mysql",
  logging: false,
};

export const sequelize = connectionUrl
  ? new Sequelize(connectionUrl, {
      ...baseOptions,
      dialectOptions: {
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      },
    })
  : new Sequelize(dbName, dbUser, dbPass, {
      ...baseOptions,
      host: dbHost,
      port: dbPort,
      dialectOptions: {
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      },
    });
