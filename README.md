# VersatileDB

A lightweight compressed database written entirely in NodeJS.

## Usage

### Creating a database instance

To create a database instance you must import DB from the module then use

```js
const database = new DB("path", { options });
```

Options:

- `schema (string)`:
  - A path to the JSON schema file, an example schema is in the examples folder.
  - Default value: `undefined`
- `validate (boolean)`:
  - If true will validate that the types of the values supplied to the `create` function match the schema.
  - Default value: `true`
- `autoinsert (boolean)`:
  - If true will automatically insert created entities into the database.
  - Default value: `true`

There are 2 ways to use VersatileDB, you can either write directly to the database or write to memory and commit later, you can decide which to use based on the architecture of the software you are making.

Both methods require you to perform an initial `read()` before any write operations can be performed.

### On File

`read()`:

- Returns: `this`.
- Description: Reads and decompresses the file into a buffer.

`read_and_get(key: string)`:

- Returns: Value of the key (string).
- Calls read first.
- Will automatically convert to object if value of key is an object.

`set_and_commit(key: string, value: string | object)`:

- No return value.
- Will automatically convert to string if the value is an object.
- Will write to the database file after setting the key and value.

`remove_and_commit(key: string)`:

- No return value.
- Will write to the database file after removing the key.

`format()`:

- No return value.
- Clears or creates the database file and sets it to the correct format for compression.
- Writes instantly.

`queue_push_and_commit()`:

- No return value.
- Calls `set()` for all items in the queue.
- Will write to the database file.
- Clears the queue.

`queue_set(key: string, value: string | object)`:

- No return value.
- Will automatically convert to string if the value is an object.
- Writes to a queue, requires `queue_push_and_commit()` to be called at some point to write to the database file.

`read_and_jsonify()`:

- Returns: The database as a JSON object.
- Quite slow on large databases.
- Reads the file to the buffer before converting.

`create_and_commit(entity_name: string, values: object)`:

- Returns: The entity as an array in the format of `[key, value]`;
- Will write to the database and will force the `autoinsert` flag to be true.
- Omits the primary key defined in the schema from the value, will be used as the key.
- Validates types according to the schema if the `validate` flag is true, uses JS types, not Typescript types.
- Will use default value of the entity item if no value for said item is given in the values object.

### On Memory

`read()`:

- Returns: `this`.
- Description: Reads and decompresses the file into a buffer.

`get(key: string)`:

- Returns: Value of the key (string).
- Will automatically convert to JSON if value of key is JSON.

`commit()`:

- No return value.
- Writes the buffer to the database file.
- Does not clear the buffer.

`set(key: string, value: string | object)`:

- No return value.
- Will automatically convert to string if the value is an object.
- Writes to the buffer, requires `commit()` to be called after to write to the database.

`remove(key: string)`:

- No return value.
- Writes to the buffer, requires `commit()` to be called after to write to the database.

`format(key: string, value: string | object)`:

- No return value.
- Clears or creates the database file and sets it to the correct format for compression.
- Writes instantly.
- Does not modify the buffer.

`queue_push()`:

- No return value.
- Calls `set()` for all items in the queue.
- Writes to the buffer, requires `commit()` to be called after to write to the database.
- Clears the queue.

`queue_set(key: string, value: string | object)`:

- No return value.
- Will automatically convert to string if the value is an object.
- Writes to a queue, requires `queue_push()` to be called at some point to write to the buffer, which will then require `commit()` to be called to write to the file.

`jsonify()`:

- Returns: The database as a JSON object.
- Quite slow on large databases.

`create(entity_name: string, values: object)`:

- Returns: The entity as an array in the format of `[key, value]`;
- Will insert into the buffer if the `autoinsert` flag is true.
- Omits the primary key defined in the schema from the value, will be used as the key.
- Validates types according to the schema if the `validate` flag is true, uses JS types, not Typescript types.
- Will use default value of the entity item if no value for said item is given in the values object.
