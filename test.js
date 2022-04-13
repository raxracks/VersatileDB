const { DB } = require("./db.js");
const database = new DB("test.db");

database.read();

console.log(`raw data length: ${database.data.length}`);
console.log(`search result: ${database.search("hello5130")}`);