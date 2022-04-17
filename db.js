const { gunzipSync, gzipSync } = require("zlib");
const { readFileSync, writeFileSync } = require("fs");
const { inherits } = require("util");

class DB {
  constructor(path, options = {}) {
    this.path = path;
    this.queue = [];
    this.data = "";

    if (options?.schema)
      this.schema = JSON.parse(
        readFileSync(options.schema, { flag: "r", encoding: "utf-8" })
      );

    this.validate = options?.validate ? options.validate : false;

    this.remove = function (key) {
      const item = `${key}:${this.get(key)}\0`;
      this.data = this.data.replace(item, "");
    };

    this.queue_set = function (key, value) {
      this.queue.push([key, value]);
    };

    this.queue_commit = function () {
      for (let i = 0; i < this.queue.length; i++) {
        const arr = this.queue[i];
        const key = arr[0];
        const value = arr[1];
        const item = `${key}:${value}\0`;

        if (!this.data.includes(`${key}:`)) {
          this.data += item;
        } else {
          const value = this.data.split(`${key}:`)[1].split("\0")[0];
          this.data = this.data.split(`${key}:${value}`).join(item);
        }
      }

      this.queue = [];
    };

    this.create = function (entity, values) {
      let s_entity = this.schema.entities[entity];
      let obj = new Object();

      if (!s_entity) throw new Error(`Unknown entity "${entity}".`);

      Object.keys(values).forEach((item) => {
        if (!s_entity[item])
          throw new SchemaError(
            `"${item}" is not in the entity "${entity}".`
          );
      });

      Object.keys(s_entity).forEach((item) => {
        if (values[item]) {
          if (this.validate && typeof values[item] !== s_entity[item].type)
            throw new SchemaError(
              `Type of "${item}" (${typeof values[
                item
              ]}) does not match schema, expected type "${
                s_entity[item].type
              }".`
            );

          obj[item] = values[item];
        } else {
          if (!s_entity[item]["value"])
            throw new SchemaError(
              `"${item}" was not specified a value and has no default value.`
            );

          obj[item] = s_entity[item]["value"];
        }
      });

      return obj;
    };

    this.set = function (key, value) {
      const item = `${key}:${value}\0`;

      if (!this.data.includes(`${key}:`)) {
        this.data += item;
      } else {
        const value = this.data.split(`${key}:`)[1].split("\0")[0];
        this.data = this.data.split(`${key}:${value}`).join(item);
      }
    };

    this.jsonify = function () {
      const items = this.data.split("\0");
      const json = {};

      for (let i = 0; i < items.length; i++) {
        const pair = items[i].split(/:(.*)/s);
        const key = pair[0];
        const value = pair[1];
        json[key] = value;
      }

      return json;
    };

    this.get = function (key) {
      if (!this.data.includes(`${key}:`)) return undefined;
      return this.data.split(`${key}:`)[1].split("\0")[0];
    };

    this.read = function () {
      this.data = gunzipSync(readFileSync(this.path, { flag: "r" })).toString();
    };

    this.format = function () {
      const deflated = gzipSync("\0");

      writeFileSync(this.path, deflated);
    };

    this.commit = function () {
      writeFileSync(this.path, gzipSync(this.data));
    };
  }
}

module.exports.DB = DB;

class SchemaError extends Error {
  constructor(message) {
    super(message);
    this.name = "SchemaError";
  }
}
