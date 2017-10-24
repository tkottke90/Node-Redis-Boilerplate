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

module.exports = {
    async addClientReq(name, email, password){
        return new Promise((resolve, reject) => {
            if(!validEmail(email)){
                resolve(false);
            }
            var inUse = emailInUse(email);
            if(!inUse) {
                var request = JSON.parse(templates.req_client);
                var salt = name.split(0,5);

                request.status = 1;
                request.req_Date = new Date();
                request.info.client_name = name;
                request.info.client_password = password;
                request.info.client_email = email;
                redis.SADDSync('req_client', JSON.stringify(request))
                     .then((add) => {
                        add ? resolve(true) : resolve(false);
                     });
            } else {
                resolve(false);
            }
        }); 
        
    },

    async addAPIReq(userGUID, apiName){
        
    },

    async getClientReq(){},

    async getClientReqByID(){},

    async getAPIReq(){},

    async getAPIReqByID(){},
    
    async authAPI( APIkey ){
        var apiExists = await redis.EXISTSync(APIkey);
        return apiExists;
    }, 
}

function createUser(){

}

function validEmail(email){
    return regExp.email.test(email);
}

function emailInUse(email){
    var result = redis.SISMEMBERSync('taken_emails', email);
    return result;
}

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
