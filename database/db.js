import knex from 'knex';
import 'dotenv/config';
const environment = process.env.NODE_ENV || "development";
import configDb from "../knexfile.js";


// console.log(knexFile[environment])
const db = knex(configDb[environment]);

export default db