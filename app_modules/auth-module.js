"use strict"

var fs = require('fs');
var crypto = require('crypto');

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

function addClientReq(name, email, password){
    return new Promise(async (resolve, reject) => {
        if(!validEmail(email)){
            reject({ "Error" : "Invalid Email", "Method" : "addClientReq()", "Code" : 1});
        }
        var inUse = await emailInUse(email);
        if(!inUse) {
            var request = JSON.parse(templates.req_client);
            var salt = name.split(0,5);

            request.status = 1;
            request.req_Date = new Date();
            request.info.client_name = name;
            request.info.client_password = password;
            request.info.client_email = email;
            
            try {
                var add = await redis.SADDSync('req_client', JSON.stringify(request));
                resolve(add);
            } catch(reject) {
                reject({"Error" : reject, "Method" : "addAPIReq()", "Code" : 3})
            }
            
            redis.SADDSync('req_client', JSON.stringify(request))
                    .then((add) => {
                    add ? resolve(true) : resolve(false);
                    });
        } else {
            reject({"Error" : "Email In Use By Another User", "Method" : "addCientReq()", "Code" : 2});
        }
    }); 
    
}

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

function getClientReq(){}

function getClientReqByID(){}

function getAPIReq(){}

function getAPIReqByID(){}

// 

async function authAPI( APIkey ){
    try {
        var result = await redis.EXISTSync(APIkey);
        return result;
    } catch(reject) {
        return false;
    }
}

function validUser(GUID){
    var result = redis.EXISTSync(GUID);
    return result;
}

function validEmail(email){
    return regExp.email.test(email);
}

function emailInUse(email){
    var result = redis.SISMEMBERSync('taken_emails', email);
    return result;
}


module.exports.addClientReq = addClientReq;
module.exports.addAPIReq = addAPIReq;

module.exports.authAPI = authAPI;

// New Client/Datastore Functions
    // Add New Client Request to Queue
    // Get Client Requests List

    // Get Client Request Info Based on ID
        
    // Approve Client Reqeust
        
    // Add New API Request to Queue

    // New API
// Authorization Functions
    // Check if API Key is Valid  

    // Check if Client Exists
