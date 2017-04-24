"use strict";

let fs = require("fs");

let useES6 = process.env.ES6 === 'true';

if (!useES6) {
    const CONFIG_FILE = process.cwd() + '/ioc.config';
    if (fs.existsSync(CONFIG_FILE)) {
        let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
        if (config.es6) {
            useES6 = true;
        }
    }
}

module.exports = require(useES6?"./es6":"./es5");