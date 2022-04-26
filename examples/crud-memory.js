// Everything done here will happen in memory and will not be committed to the file until commit() is called

import { DB } from "../VersatileDB.js";
(async () => {
  const database = new DB("example.db", {
    schema: "schema.json",
    validate: true,
    autoinsert: true,
  }).read();

  // Create
  console.log(
    "Create:",
    await database.create("package", {
      name: "ccjr",
      user: "cjr-org",
      repo: "ccjr-pkg",
    })
  );

  // Read
  console.log("Read:", await database.findOne({ name: "ccjr" }));

  // Update
  await database.updateOne({ name: "ccjr" }, { repo: "test" });
  console.log("Update:", await database.findOne({ name: "ccjr" }));

  // Delete
  await database.removeOne({ name: "ccjr" });

  // Check if removed
  console.log("Delete:", await database.findOne({ name: "ccjr" }));

  // Commit all changes
  database.commit();
})();
