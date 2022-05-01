import { gunzipSync, gzipSync } from "zlib";
import { readFileSync, writeFileSync, existsSync } from "fs";

export class DB {
  constructor(path, options = {}) {
    this.path = path;
    this.queue = [];
    this.data = "";
    this.itemValueDelimiter = "{:}";
    this.itemDelimiter = "{|}";

    if (options.schema)
      this.schema = JSON.parse(
        readFileSync(options.schema, { flag: "r", encoding: "utf-8" })
      );

    this.validate = options.validate ? options.validate : true;
    this.autoinsert = options.autoinsert ? options.autoinsert : true;

    this.INTERNAL_RANDOM = function () {
      return new Array(20)
        .fill("")
        .map((_, idx) =>
          idx % Math.floor(Math.random() * 5) == 0
            ? String.fromCharCode(97 + Math.floor(Math.random() * 26))
            : Math.floor(Math.random() * 9)
        )
        .join("");
    };

    this.INTERNAL_STRINGIFY = function (value) {
      return Object.keys(value)
        .map((key) => `${key}${this.itemValueDelimiter}${value[key]}`)
        .join(this.itemDelimiter);
    };

    this.INTERNAL_PARSE = async function (value) {
      if (!value) return undefined;
      let stringObj = `{"${value
        .split("{:}")
        .join(`":"`)
        .split("{|}")
        .join(`","`)}"}`;

      if (stringObj.includes("ref:")) {
        let ref = stringObj.split("ref:")[1];
        let path = ref.split(">")[0];
        let key = ref.split(">")[1];
        let value = ref.split(">")[2].split('"')[0];

        const refDB = new DB(path).read();

        const filter = {};
        filter[key] = value;

        stringObj = stringObj
          .split(`"ref:${path}>${key}>${value}"`)
          .join(JSON.stringify(await refDB.findOne(filter)));
      }

      const obj = JSON.parse(stringObj);

      return obj;
    };

    this.INTERNAL_FIND = function (value) {
      const regex = new RegExp(`.*(${value}).*`, "gi");
      const match = this.data.match(regex);

      return match;
    };

    this.INTERNAL_SET = function (value) {
      const newValue = this.INTERNAL_STRINGIFY(value);
      this.data += `${newValue}\n`;

      return this;
    };

    this.INTERNAL_ESCAPE = function (value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    this.removeOne = function (filter) {
      return new Promise(async (res, rej) => {
        for (const key of Object.keys(filter)) {
          let value = `${key}${this.itemValueDelimiter}${filter[key]}`;

          if (typeof filter[key] === "object") {
            value = `(.*?)${this.INTERNAL_ESCAPE(
              Object.keys(filter[key])[0]
            )}>${this.INTERNAL_ESCAPE(
              filter[key][Object.keys(filter[key])[0]]
            )}`;
          }

          const match = this.INTERNAL_FIND(value);

          if (match) {
            this.data = this.data.replace(match[0], "");
          }
        }

        res(true);
      });
    };

    this.find = async function (filter) {
      return new Promise(async (res, rej) => {
        const results = [];

        const keys = Object.keys(filter);

        if (keys.length === 0) {
          for (const line of this.data.split("\n")) {
            if (!!line.trim()) results.push(await this.INTERNAL_PARSE(line));
          }
        }

        for (const key of keys) {
          let value = `${key}${this.itemValueDelimiter}${filter[key]}`;

          if (typeof filter[key] === "object") {
            value = `(.*?)${this.INTERNAL_ESCAPE(
              Object.keys(filter[key])[0]
            )}>${this.INTERNAL_ESCAPE(
              filter[key][Object.keys(filter[key])[0]]
            )}`;
          }

          const match = this.INTERNAL_FIND(value);

          if (match) {
            for (const m of match) {
              results.push(await this.INTERNAL_PARSE(m));
            }
          }
        }

        res(results);
      });
    };

    this.findOne = async function (filter) {
      return new Promise(async (res, rej) => {
        Object.keys(filter).forEach(async (key) => {
          const value = this.INTERNAL_ESCAPE(
            `${key}${this.itemValueDelimiter}${filter[key]}`
          );

          const match = this.INTERNAL_FIND(value);

          if (match) {
            res(await this.INTERNAL_PARSE(match[0]));
          } else {
            res(undefined);
          }
        });
      });
    };

    this.ref = function (filter) {
      return new Promise(async (res, rej) => {
        res(
          `ref:${this.path}>${Object.keys(filter)[0]}>${
            filter[Object.keys(filter)[0]]
          }`
        );
      });
    };

    this.create = function (entity, values) {
      return new Promise((res, rej) => {
        let s_entity = this.schema?.entities[entity];
        let obj = new Object();

        if (!s_entity) throw new Error(`Unknown entity "${entity}".`);

        Object.keys(values).forEach((item) => {
          if (!s_entity[item])
            throw new SchemaError(
              `"${item}" is not in the entity "${entity}".`
            );
        });

        Object.keys(s_entity).forEach((item) => {
          if (item === "key" || item === s_entity["key"]) return;

          if (values[item]) {
            if (
              this.validate &&
              s_entity[item].type !== "ref" &&
              typeof values[item] !== s_entity[item].type
            )
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

        do {
          obj[s_entity["key"]] = this.INTERNAL_RANDOM();
        } while (this.data.includes(obj[s_entity["key"]]));

        if (this.autoinsert) this.INTERNAL_SET(obj);

        res(obj);
      });
    };

    this.updateOne = async function (filter, replacements) {
      const item = await this.findOne(filter);
      const newItem = Object.assign({}, item);

      for (const replacement of Object.keys(replacements)) {
        newItem[replacement] = replacements[replacement];
      }

      this.update(item, newItem);
    };

    this.update = function (previous, updated) {
      this.data = this.data
        .split(this.INTERNAL_STRINGIFY(previous))
        .join(this.INTERNAL_STRINGIFY(updated));
    };

    this.read = function () {
      if (!existsSync(this.path)) this.format();

      this.data = gunzipSync(readFileSync(this.path, { flag: "r" })).toString();
      return this;
    };

    this.format = function () {
      const deflated = gzipSync("");

      writeFileSync(this.path, deflated);

      return this;
    };

    this.commit = function () {
      writeFileSync(this.path, gzipSync(this.data));
      return this;
    };
  }
}

class SchemaError extends Error {
  constructor(message) {
    super(message);
    this.name = "SchemaError";
  }
}
