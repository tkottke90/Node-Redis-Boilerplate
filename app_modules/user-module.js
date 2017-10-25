"use strict"

var fs = require('fs');
var crypto = require('crypto');

var redis = require('./redis-module'); 
var smc = require('./server-message-creator');

var templates = {
    user : fs.readFileSync('./app_modules/template/user-template.json', "UTF-8"),
    req_client : fs.readFileSync('./app_modules/template/req_client-template.json', "UTF-8"),
};

// Functions

function generateGUID(){}

function genEncyptPassword(){}

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
                var add = await redis.SADDSync('req_clients', JSON.stringify(request));
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

function getClientReq(){
    return new Promise(async (resolve, reject) => {
        try {
            var clients = await redis.SMEMBERSSync('req_clients');
            resolve(clients);
        } catch(err) {
            reject({"Error" : err, "Method" : "getClientReq()", "Code" : 1});
        }
    });
}

function getClientReqByID(listID){
    return new Promise(async (resolve, reject) => {
        try {
            var clients = await redis.SMEMBERSSync('req_clients');
            resolve(clients[listID]);
        } catch(err) {
            reject({"Error" : err, "Method" : "getClientReqByID()", "Code" : 1});
        }
    });
}

function getClientReqByStatus(status){
    return new Promise(async (resolve, reject) => {
        try {
            var clients = await redis.SMEMBERSSync('req_clients');
            var pendingClients = [];

            clients.forEach((client) => {
                var clientJSON = JSON.parse(client);
                if(clientJSON.status == status){
                    pendingClients.push(client);
                }
            });

            resolve(pendingClients);
        } catch(err) {
            reject({"Error" : err, "Method" : "getClientReqByStatus()", "Code" : 1})
        }
    });
}

function delClientReq(reqID){
    return new Promise(async (resolve, reject) => {
        try{
            var client = await redis.SMEMBERSSync('req_clients');
            if(reqID < (client.length - 1)){    
                var rem = await redis.SREMSync('req_clients', client[reqID]);
                resolve(rem);
            } else {
                reject({"Error" : "IndexOutOfBounds", "Method" : "delClientReq()", "Code" : 2})    
            }
        } catch(err) {
            reject({"Error" : err, "Method" : "delClientReq()", "Code" : 1})
        }
    });
}

function createAccount(reqObject){

}

// Exports

module.exports.addClientReq = addClientReq;

module.exports.getClientReq = getClientReq;
module.exports.getClientReqByID = getClientReqByID;
module.exports.getClientReqByStatus = getClientReqByStatus;

module.exports.delClientReq = delClientReq;