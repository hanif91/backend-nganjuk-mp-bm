import knex from "knex";
import "dotenv/config";
const environment = process.env.NODE_ENV || "development";
import configDb, { configDbBacameter } from "../knexfile.js";

// console.log(knexFile[environment])
const db = knex(configDb[environment]);
export const dbBacameter = knex(configDbBacameter[environment]);

export default db;
