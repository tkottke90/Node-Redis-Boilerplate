"use strict"

var fs = require('fs');
var crypto = require('crypto');
var uuid = require('uuid/v1')

var redis = require('./redis-module'); 
var smc = require('./server-message-creator');
var users = require('./user-module');

var templates = {
    req_API : fs.readFileSync('./app_modules/template/req_data-template.json', 'UTF-8')
}

//region Private Functions

async function addToAPILog(apiKey, event, notes){
    try{
        // Get User Logs
        var logs = await redis.HGETSync(apiKey, 'logs');
        // Get Event Logs
        var eventLog = JSON.parse(logs);
        // Get Current Time 
        var curTime = Date.now();

        eventLog.log[curTime] = {
            "event" : event,
            "notes" : notes
        }

        var write = await redis.HSETSync(apiKey, 'logs', JSON.stringify(eventLog));
        return write;

    } catch(reject) {
        smc.getMessage(0,5,`Error Adding Log to User: ${apiKey} - Error: ${reject}`);
        return false;
    }
}

async function apiModified(apiKey){
    var curTime = Date.now();
    try {
        var write = await redis.HSETSync(GUID, 'last-update', curTime);
    } catch(err) {
        return false
    }
    return write
}

//endregion Private Functions
//region Exported Methods

function addAPIReq(userGUID, apiName){
    return new Promise(async (resolve, reject) => {
        var request = JSON.parse(templates.req_API);

        request.status = 1;
        request.req_date = new Date();
        request.info.clientGUID = userGUID;
        request.info.project_name = apiName;

        try{
            var add = await redis.SADDSync('req_api', JSON.stringify(request));
            resolve(add);
        } catch(reject) {
            reject({"Error" : reject, "Method" : "addAPIReq()", "Code" : 1});
        }
    });
}

function getAPIReq(){
    return new Promise(async (resolve, reject) => {
        try {
            var apis = await redis.SMEMBERSSync('req_api');
            resolve(apis);
        } catch(err) {
            reject({"Error" : err, "Method" : "getAPIReq()", "Code" : 1});
        }
    });
}

function getAPIReqByID(apiID){
    return new Promise(async (resolve, reject) => {
        try {
            var apis = await redis.SMEMBERSSync('req_api');
            resolve(apis[apiID]);
        } catch(err) {
            reject({"Error" : err, "Method" : "getAPIReqByID()", "Code" : 1});
        }
    });    
}

function deleteAPIReq(apiID){
    return new Promise(async (resolve, reject) => {
        try{
            var api = await redis.SMEMBERSSync('req_api');
            if(apiID < api.length){    
                var rem = await redis.SREMSync('req_api', api[apiID]);
                resolve(rem);
            } else {
                reject({"Error" : "IndexOutOfBounds", "Method" : "delAPIReq()", "Code" : 2})    
            }
        } catch(err) {
            reject({"Error" : err, "Method" : "delAPIReq()", "Code" : 1})
        }
    });
}



//endregion Exported Methods

//region Exports

module.exports.addAPIReq = addAPIReq;
module.exports.getAPIReq = getAPIReq;
module.exports.getAPIReqByID = getAPIReqByID;
module.exports.deleteAPIReq = deleteAPIReq;
