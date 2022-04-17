const { DB } = require("./db.js");
const database = new DB("test.db", { schema: "./schema.json", validate: true });

database.read();
console.log(database.create("package", {
    name: "ccjr",
    user: "cjr-org",
    repo: "ccjr-pkg"
}));