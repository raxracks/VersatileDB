import { DB } from "../versatiledb.js";

const database = new DB("example.db", {
  schema: "schema.json",
  validate: true,
  autoinsert: true,
}).format();
