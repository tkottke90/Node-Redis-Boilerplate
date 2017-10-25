"use strict"

var fs = require('fs');
var crypto = require('crypto');
var guid = require('guid');

var redis = require('./redis-module'); 
var smc = require('./server-message-creator');

var templates = {
    user : fs.readFileSync('./app_modules/template/user-template.json', "UTF-8"),
    data : fs.readFileSync('./app_modules/template/data-template.json', "UTF-8"),
    req_client : fs.readFileSync('./app_modules/template/req_client-template.json', "UTF-8"),
    req_API : fs.readFileSync('./app_modules/template/req_data-template.json', "UTF-8"),
};

var regExp = {
    email : /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
}

// Functions

async function authAPI( APIkey ){
    try {
        var result = await redis.EXISTSync(APIkey);
        return result;
    } catch(reject) {
        return false;
    }
}

// Exports

module.exports.authAPI = authAPI;

