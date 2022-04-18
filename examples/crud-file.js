// Everything done here will instantly commit to the file

import { DB } from "../versatiledb.js";

const database = new DB("example.db", {
  schema: "schema.json",
  validate: true,
  autoinsert: true,
}).read();

// Create
database.create_and_commit("package", {
  name: "ccjr",
  user: "cjr-org",
  repo: "ccjr-pkg",
});

// Read
console.log(database.read_and_get("ccjr"));

// Update
const pkg = database.read_and_get("ccjr");
pkg.repo = "test";
database.set_and_commit("ccjr", pkg);
console.log(database.read_and_get("ccjr"));

// Delete
database.remove_and_commit("ccjr");

// Check if removed
console.log(database.read_and_get("ccjr"));
