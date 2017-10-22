"use strict"

var fs = require('fs');

var redis = require('./redis-module'); 

var templates = {
    user : "",
    data : fs.readFileSync('./app_modules/template/data-template.json', "UTF-8"),
    req_client : "",
    req_API : ""
};

module.exports = {
    addClientReq(name, email, password){
        return Promise((resolve, reject) => {

        });
    }, 
    async authAPI( APIkey ){
        var apiExists = await redis.EXISTSync(APIkey);
        resolve(apiExists);
    } 
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
