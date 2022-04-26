# VersatileDB

A lightweight compressed database written entirely in NodeJS.

## Filter

You may recognize the format of the filter argument, as it is similar to ORM libraries.

### Syntax

The filter is an object, each key is correlated to a column in the table, and its value is the search query.

### Examples

If the data looks like the following:

```
id           | name
-------------|---------------
ExampleID1   | ExampleName1
ExampleID2   | ExampleName2
ExampleID3   | ExampleName3
```

You could find the second row with either of the following queries:

- `{ id: "ExampleID2" }`
- `{ name: "ExampleName2" }`

### Limitations

- Currently can only search through 1 nested object, will not search deeper, and assumes that any nested object must be a reference to another file.
  - Example: `{user: {id: "ExampleID"}}` becomes `ref:file.db>id>ExampleID` behind the scenes.

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

VersatileDB writes to memory, and you must commit to the file with `commit()` at a later point in time.

You are required to perform an initial `read()` before any other operations can be performed.

In the case that the database file does not exist `format()` will be called to create the file.

`read()`:

- Returns: `this`.
- Description: Reads and decompresses the file into a buffer.
- Creates the database file if there is none

`format()`:

- Returns: `this`.
- Clears or creates the database file and sets it to the correct format for compression.
- Writes instantly.
- Does not modify the buffer.

`commit()`:

- No return value.
- Writes the buffer to the database file.
- Does not clear the buffer.

`find(filter: object): array<object>`:

- Returns: An array of the matching rows in the database.
- Description: Finds a row in the current database, uses Regex and can find partial matches.

`findOne(filter: object): object`:

- Returns: The matching row in the database.
- Description: Finds a row in the current database, uses Regex and can find partial matches.

`updateOne(filter: object, newDataFilter: object)`:

- Returns: `this`.
- The first filter is used to find the row, the second is used to specify which values are updated and what the new values are.

<!-- `remove(key: string)`:

- No return value.
- Writes to the buffer, requires `commit()` to be called after to write to the database. -->

`create(entity_name: string, values: object): object`:

- Returns: The created entity.
- Will insert into the buffer if the `autoinsert` flag is true.
- Omits the `key` defined in the schema from the value, will be used as the unique ID.
- Validates types according to the schema if the `validate` flag is true.
- Will use default value of the entity item if no value for said item is given in the values object.

`ref(filter: object): string`:

- Returns: The row represented as a reference data string.
- Can be used for referencing data in other databases.
