'use strict';

const fs = require('fs');
const files = fs.readdirSync('.');

if (!files.includes('template.json')) {
    console.error('Unable to find template.json. Did you run this script from your root system directory?');
}


const template = JSON.parse(fs.readFileSync('template.json').toString());
// Backup user's template file
fs.copyFileSync('template.json', 'template.json.bak');

if (!template.hasOwnProperty('Item')) {
    template['Item'] = {};
}

if (!template.Item.hasOwnProperty('types')) {
    template.Item['types'] = [];
}
if (!template.Item.types.includes('PDFoundry_PDF')) {
    template.Item.types.push('PDFoundry_PDF');
}

if (!template.Item.hasOwnProperty('PDFoundry_PDF')) {
    template.Item['PDFoundry_PDF'] = {};
}

const properties = [
    ['url',     ''],
    ['code',    ''],
    ['offset',  0],
    ['cache',   false],
];

for (const [key, value] of properties) {
    if (!template.Item.PDFoundry_PDF.hasOwnProperty(key)) {
        template.Item.PDFoundry_PDF[key] = value;
        continue;
    }

    if (!template.Item.PDFoundry_PDF[key] !== value) {
        template.Item.PDFoundry_PDF[key] = value;
    }
}

const contents = JSON.stringify(template, null, 4);
fs.writeFileSync('template.json', contents);
console.log('Installed template.');


