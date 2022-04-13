const { DB } = require("./db.js");
const database = new DB("test.db");

database.read();
console.log(database.get("hello70029"));
console.log(database.get("hello"));

database.set("hello", "sex");
database.finalize();