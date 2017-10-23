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

module.exports = {
    addClientReq(name, email, password){
        return new Promise((resolve, reject) => {
            emailInUse(email).then((result) => {
                if(!result) {
                    var request = JSON.parse(templates.req_client);
                    var salt = name.split(0,5);
                    
                    request.status = 1;
                    request.req_Date = new Date();
                    request.info.client_name = name;
                    request.info.client_email = email;
                    reqeust.info.client_password = password;

                    redis.SADDSync('req_client', JSON.stringify(request))
                        .then((resolve) => {
                           resolve(true);
                        }).catch((err) => {
                           smc.getMessage(1,0,`Error: ${err}`);
                           reject(err);
                        });
                } else {
                    reject(false);
                }
            }); 
        });
    },



    async authAPI( APIkey ){
        var apiExists = await redis.EXISTSync(APIkey);
        return apiExists;
    } 
}

function createUser(){

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
