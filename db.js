const { gunzipSync, gzipSync } = require("zlib");
const { readFileSync, writeFileSync } = require("fs");

class DB {
    constructor(path) {
        this.path = path;
        this.queue = [];
        this.data = "";

        this.read = function() {
            this.data = gunzipSync(readFileSync(this.path, {flag:'r'})).toString();
        }

        this.finalize = function() {
            console.log("finalizing...");
        
            writeFileSync(this.path, gzipSync(this.data));

            console.log("done");
        }

        this.format = function() {
            const deflated = gzipSync("");
        
            writeFileSync(this.path, deflated);
        }

        this.search = function(word) {
            let results = [];

            let expr = new RegExp(`(${word})\\w+`, 'gi');
            let match = this.data.match(expr);
            if(match !== null) results.push(...this.data.match(expr))

            expr = new RegExp(`\\w+(${word})`, 'gi');
            match = this.data.match(expr);
            if(match !== null) results.push(...this.data.match(expr))

            expr = new RegExp(`\\w+(${word})\\w+`, 'gi');
            match = this.data.match(expr);
            if(match !== null) results.push(...this.data.match(expr))

            return results;
        }

        this.queue_set = function(key, value) {
            this.queue.push([key, value]);
        }

        this.queue_done = function() {        
            for(let i = 0; i < this.queue.length; i++) {
                const arr = this.queue[i];
                const key = arr[0];
                const value = arr[1];
                const item = `\0${key}:${value}`;
        
                if(!this.data.includes(`${key}:`)) {
                    this.data += item;
                } else {
                    const value = this.data.split(`${key}:`)[1].split("\0")[0];
                    this.data = this.data.split(`${key}:${value}`).join(item);
                }
            }
        
            this.queue = [];
        }

        this.set = function(key, value) {        
            const item = `\0${key}:${value}`;

            if(!this.data.includes(`${key}:`)) {
                this.data += item;
            } else {
                const value = this.data.split(`${key}:`)[1].split("\0")[0];
                this.data = this.data.split(`${key}:${value}`).join(item);
            }
        }

        this.jsonify = function() {        
            const items = this.data.split("\0");
            const json = {};
        
            for(let i = 0; i < items.length; i++) {
                const pair = items[i].split(/:(.*)/s);
                const key = pair[0];
                const value = pair[1];
                json[key] = value;
            }
            
            return json;
        }

        this.get = function(key) {
            if(!this.data.includes(`${key}:`)) return undefined;
            return this.data.split(`${key}:`)[1].split("\0")[0];
        }
    }
}

module.exports.DB = DB;