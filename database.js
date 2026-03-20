// database.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE;
const dbUser = process.env.DB_USER || process.env.MYSQLUSER;
const dbPass = process.env.DB_PASS || process.env.MYSQLPASSWORD;
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);
const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

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
