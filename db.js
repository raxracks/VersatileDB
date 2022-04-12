const fs = require('fs');
const zlib = require('zlib');

function format(path) {
    const deflated = zlib.deflateSync("");

    fs.writeFileSync(path, deflated);
}

function queue(path, key, value) {
    
}

function write(path, key, value) {
    let data = zlib.inflateSync(fs.readFileSync(path, {flag:'r'})).toString();
    const item = `${key}:${value}`;

    if(!data.includes(`${key}:`)) {
        data += `\0${item}`;
    } else {
        const value = data.split(`${key}:`)[1].split("\0")[0];
        data = data.split(`${key}:${value}`).join(`\0${item}`);
    }

    // const keys = Object.keys(data);

    // for(let i = 0; i < keys.length; i++) {
    //     output += `${keys[i]}:${data[keys[i]]}\0`;
    // }

    const deflated = zlib.deflateSync(data);

    fs.writeFileSync(path, deflated);
}

function read(path) {
    const data = zlib.inflateSync(fs.readFileSync(path, {flag:'r'})).toString();

    const items = data.split("\0");
    const json = {};

    for(let i = 0; i < items.length; i++) {
        const pair = items[i].split(/:(.*)/s);
        const key = pair[0];
        const value = pair[1];
        json[key] = value;
    }
    
    return json;
}

function get(path, key) {
    let data = zlib.inflateSync(fs.readFileSync(path, {flag:'r'})).toString();
    return data.split(`${key}:`)[1].split("\0")[0];
}

format("test");
write("test", "fuck", "balls");
write("test", "fuck", "ball");
write("test", "fuck", "arabia");
write("test", "frick", "ball");
for(let i = 0; i < 10000; i++)
    write("test", `fuck${i}`, `balls${i}`);
fs.writeFileSync("test.json", JSON.stringify(read("test")));
console.log(get("test", "frick"));