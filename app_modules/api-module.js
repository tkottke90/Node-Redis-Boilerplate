"use strict"

var fs = require('fs');
var crypto = require('crypto');

var redis = require('./redis-module'); 
var smc = require('./server-message-creator');

// Functions

function addAPIReq(userGUID, apiName){
    return new Promise(async (resolve, reject) => {
        var validGUID = validUser(userGUID);
        if(validGUID){
            var request = JSON.parse(templates.req_API);

            request.status = 1;
            request.req_date = new Date();
            request.info.clientGUID = userGUID;
            request.info.project_name = apiName;

            try{
                var add = await redis.SADDSync('req_api', JSON.stringify(request));
                resolve(add);
            } catch(reject) {
                reject({"Error" : reject, "Method" : "addAPIReq()", "Code" : 2});
            }

        } else {
            reject({"Error" : "No User Found", "Method" : "addAPIReq()", "Code" : 1});
        }
    });
}

function getAPIReq(){}

function getAPIReqByID(){}

// Exports