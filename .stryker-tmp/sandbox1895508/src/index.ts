'use strict';

const isBrowser = new Function('try {return this===window;}catch(e){return false;}');
const isWebWorker = new Function('try {return self instanceof WorkerGlobalScope;}catch(e){return false;}');

let useES6 = false;
if (!isBrowser() && !isWebWorker()) {
    useES6 = process.env.ES6 === 'true';
    if (!useES6) {
        const fs = require('fs');
        const path = require('path');
        const searchConfigFile = function() {
            let configFile = path.join(__dirname, 'ioc.config');
            while (!fs.existsSync(configFile)) {
                const fileOnParent = path.normalize(path.join(path.dirname(configFile), '..', 'ioc.config'));
                if (configFile === fileOnParent) {
                    return null;
                }
                configFile = fileOnParent;
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
