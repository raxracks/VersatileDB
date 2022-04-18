import { gunzipSync, gzipSync } from 'zlib';
import { readFileSync, writeFileSync } from 'fs';

export class DB {
  schema: string;
  path: string;
  queue: any[];
  data: string;
  validate: boolean;
  autoinsert: boolean;
  remove: (key: string) => void;
  queue_set: (key: string, value: any) => void;
  queue_push: () => void;
  create: (entity: string, values: object) => any[];
  set: (key: string, value: any) => void;
  jsonify: () => {};
  get: (key: string) => any;
  read: () => any;
  format: () => void;
  commit: () => void;
  create_and_commit: (entity: string, values: object) => void;
  set_and_commit: (key: string, value: any) => void;
  read_and_get: (key: string) => any;
  read_and_jsonify: () => {};
  remove_and_commit: (key: string) => void;
  queue_push_and_commit: () => void;

  constructor(path, options) {
    this.path = path;
    this.queue = [];
    this.data = '';

    if (options.schema)
      this.schema = JSON.parse(
        readFileSync(options.schema, { flag: 'r', encoding: 'utf-8' }),
      );

    this.validate = options.validate ? options.validate : true;
    this.autoinsert = options.autoinsert ? options.autoinsert : true;

    this.remove = function (key) {
      let item = `${key}:${this.get(key)}\0`;

      if (typeof this.get(key) === 'object')
        item = `${key}:${JSON.stringify(this.get(key))}\0`;

      this.data = this.data.replace(item, '');
    };

    this.queue_set = function (key, value) {
      this.queue.push([key, value]);
    };

    this.queue_push = function () {
      for (let i = 0; i < this.queue.length; i++) {
        const arr = this.queue[i];
        const key = arr[0];
        const value = arr[1];

        this.set(key, value);
      }

      this.queue = [];
    };

    this.create = function (entity, values) {
      let s_entity = this.schema.entities[entity];
      let obj = new Object();

      if (!s_entity) throw new Error(`Unknown entity "${entity}".`);

      Object.keys(values).forEach((item) => {
        if (!s_entity[item])
          throw new SchemaError(`"${item}" is not in the entity "${entity}".`);
      });

      Object.keys(s_entity).forEach((item) => {
        if (item === 'primary') return;
        if (item === s_entity['primary']) return;

        if (values[item]) {
          if (this.validate && typeof values[item] !== s_entity[item].type)
            throw new SchemaError(
              `Type of "${item}" (${typeof values[
                item
              ]}) does not match schema, expected type "${
                s_entity[item].type
              }".`,
            );
          obj[item] = values[item];
        } else {
          if (!s_entity[item]['value'])
            throw new SchemaError(
              `"${item}" was not specified a value and has no default value.`,
            );

          obj[item] = s_entity[item]['value'];
        }
      });

      if (this.autoinsert) this.set(values[s_entity['primary']], obj);

      return [values[s_entity['primary']], obj];
    };

    this.set = function (key, value) {
      if (typeof value == 'object') value = JSON.stringify(value);
      const item = `${key}:${value}\0`;

      if (!this.data.includes(`${key}:`)) {
        this.data += item;
      } else {
        const value = this.data.split(`${key}:`)[1].split('\0')[0];
        this.data = this.data.split(`${key}:${value}`).join(item);
      }
    };

    this.jsonify = function () {
      const items = this.data.split('\0');
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

      let d = this.data.split(`${key}:`)[1].split('\0')[0];
      if (typeof JSON.parse(d) == 'object') d = JSON.parse(d);
      return d;
    };

    this.read = function () {
      this.data = gunzipSync(readFileSync(this.path, { flag: 'r' })).toString();
      return this;
    };

    this.format = function () {
      const deflated = gzipSync('\0');

      writeFileSync(this.path, deflated);
    };

    this.commit = function () {
      writeFileSync(this.path, gzipSync(this.data));
    };

    this.create_and_commit = function (entity, values) {
      this.autoinsert = true;
      this.create(entity, values);
      this.commit();
    };

    this.set_and_commit = function (key, value) {
      this.set(key, value);
      this.commit();
    };

    this.read_and_get = function (key) {
      this.read();
      return this.get(key);
    };

    this.read_and_jsonify = function () {
      this.read();
      return this.jsonify();
    };

    this.remove_and_commit = function (key) {
      this.remove(key);
      this.commit();
    };

    this.queue_push_and_commit = function () {
      this.queue_push();
      this.commit();
    };
  }
}

class SchemaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SchemaError';
  }
}
