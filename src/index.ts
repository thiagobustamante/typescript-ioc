'use strict';

const isBrowser = new Function('try {return this===window;}catch(e){return false;}');

let useES6 = false;
if (!isBrowser()) {
    const fs = require('fs');
    useES6 = process.env.ES6 === 'true';
    if (!useES6) {
        const CONFIG_FILE = process.cwd() + '/ioc.config';
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
            if (config.es6) {
                useES6 = true;
            }
        }
    }
}

module.exports = require(useES6?'./es6':'./es5');
