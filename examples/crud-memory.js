// Everything done here will happen in memory and will not be committed to the file until commit() is called

import { DB } from "../VersatileDB.js";

const database = new DB("example.db", {
  schema: "schema.json",
  validate: true,
  autoinsert: true,
}).read();

// Create
database.create("package", {
  name: "ccjr",
  user: "cjr-org",
  repo: "ccjr-pkg",
});

// Read
console.log(database.get("ccjr"));

// Update
const pkg = database.get("ccjr");
pkg.repo = "test";
database.set("ccjr", pkg);
console.log(database.get("ccjr"));

// Delete
database.remove("ccjr");

// Check if removed
console.log(database.get("ccjr"));

// Commit all changes
database.commit();
