import "dotenv/config";
const {
  DB_PORT,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT_DEV,
  DB_HOST_DEV,
  DB_USER_DEV,
  DB_PASSWORD_DEV,
  DB_NAME_DEV,
} = process.env;

const configDb = {
  development: {
    client: "mysql2",
    connection: {
      host: DB_HOST_DEV,
      port: DB_PORT_DEV,
      user: DB_USER_DEV,
      password: DB_PASSWORD_DEV,
      database: DB_NAME_DEV,
    },
    pool: { min: 0, max: 15 },
  },

  production: {
    client: "mysql2",
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    },
    pool: { min: 0, max: 15 },
  },
};

export const configDbBacameter = {
  development: {
    client: "mysql2",
    connection: {
      host: DB_HOST_DEV,
      port: DB_PORT_DEV,
      user: DB_USER_DEV,
      password: DB_PASSWORD_DEV,
      database: DB_NAME_BACAMETER_DEV,
    },
    pool: { min: 0, max: 15 },
  },

  production: {
    client: "mysql2",
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME_BACAMETER,
    },
    pool: { min: 0, max: 15 },
  },
};

export default configDb;
