'use strict';

const isBrowser = new Function('try {return this===window;}catch(e){return false;}');

let useES6 = false;
if (!isBrowser()) {
    useES6 = process.env.ES6 === 'true';
    if (!useES6) {
        const fs = require('fs');
        const path = require('path');
        const searchConfigFile = function() {
            let configFile = path.join(__dirname, 'ioc.config');
            const ROOT = path.join('/', 'ioc.config');
            while (!fs.existsSync(configFile)) {
                if (configFile === ROOT) {
                    return null;
                }
                configFile = path.normalize(path.join(path.dirname(configFile), '..', 'ioc.config'));
            }
            return configFile;
        };

        const CONFIG_FILE = searchConfigFile();
        if (CONFIG_FILE && fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
            if (config.es6) {
                useES6 = true;
            }
        }
    }
}

module.exports = require(useES6?'./es6':'./es5');
