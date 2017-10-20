"use strict"

var fs = require('fs');

var redis = require('./redis-module'); 

var templates = {
    user : "",
    data : fs.readFileSync('./app_modules/template/data-template.json', "UTF-8"),
    req_client : "",
    req_API : ""
};

// module.exports = {
//     addClientReq : addClientReq,
//     authAPI : authAPI
// }

// New Client/Datastore Functions
    // Add New Client Request to Queue
        var addClientReq = function(name, email, password){
            return Promise((resolve, reject) => {

            });
        };
    // Get Client Requests List

    // Get Client Request Info Based on ID
        
    // Approve Client Reqeust
        
    // Add New API Request to Queue

    // New API
// Authorization Functions
    // Check if API Key is Valid  
        var authAPI = async function( APIkey ){
            var result =  await redis.EXISTSync(APIkey);
            return result;
        };

    // Check if Client Exists


module.exports = {
    addClientReq(){},
    async authAPI(){
        var result =  await redis.EXISTSync(APIkey);
        return result;
    }
}