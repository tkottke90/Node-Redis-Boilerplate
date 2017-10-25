"use strict"

var fs = require('fs');
var crypto = require('crypto');
var guid =  require('guid');

var redis = require('./redis-module'); 
var smc = require('./server-message-creator');

var templates = {
    user : fs.readFileSync('./app_modules/template/user-template.json', "UTF-8"),
    req_client : fs.readFileSync('./app_modules/template/req_client-template.json', "UTF-8"),
};

// Functions

function generateGUID(){
    var newGUID =  guid.create();
    return newGUID.toString();
}

function genEncyptPassword(password, salt){
    var password = crypto.createHmac('sha512', password)
                         .update(salt)
                         .digest('hex');

    return password;
}

function validUser(GUID){
    var result = redis.EXISTSync(GUID);
    return result;
}

function validEmail(email){
    return regExp.email.test(email);
}

function emailInUse(email){
    var result = redis.HEXISTSync('users', email);
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
            request.req_Date = new Date().getMilliseconds();
            request.info.client_name = name;
            request.info.client_password = password;
            request.info.client_email = email;
            
            try {
                var add = await redis.SADDSync('req_clients', JSON.stringify(request));
                resolve(add);
            } catch(reject) {
                reject({"Error" : reject, "Method" : "addAPIReq()", "Code" : 3})
            }
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

function createAccount(requestID){
    return new Promise(async (resolve, reject) => {
        try{
            var clients = await redis.SMEMBERSSync('req_clients');
            console.log(new Date());
            var request = JSON.parse(clients[requestID]);
            
            var salt = request.info.client_name.slice(0,5);
            var newName = request.info.client_name.split(' ');
            var now = new Date();
            var logs = {
                log : {
                    now : { "event" : "account created" }
                },
                security : {
                    now : { "event" : "password reset", "notes" : "account setup" }
                }
            };
            var passwords = {
                "password" : genEncyptPassword(request.info.client_password, salt),
                "salt" : salt
            };
            var GUID = generateGUID();

            var add = await redis.HSETNXSync(GUID,'email', request.info.client_email);                       
            if(add){
                try {
                    await redis.HSETSync(GUID,'name', JSON.stringify({ "First" : newName[0], "Last" : newName[1] }));
                    await redis.HSETSync(GUID, 'passwords', JSON.stringify(passwords));
                    await redis.HSETSync(GUID, 'logs', JSON.stringify(logs));

                    request.status = 0;

                    await redis.SREMSync('req_clients', clients[requestID]);
                    await redis.SADDSync('req_clients', JSON.stringify(request));

                    await redis.HSETSync('users',request.info.client_email,GUID);

                } catch(err) {
                    reject({"Error" : "Error Adding User Values", "Method" : "createAccount()", "Code" : 3});
                }
                resolve(true);
            } else {
                reject({"Error" : "Error Adding User", "Method" : "createAccount()", "Code" : 2})
            }

        } catch(err) {
            reject(new Error(`{"Error" : ${err}, "Method" : "createAccount()", "Code" : 1}`));    
        }
    });
}

// Exports

module.exports.addClientReq = addClientReq;

module.exports.getClientReq = getClientReq;
module.exports.getClientReqByID = getClientReqByID;
module.exports.getClientReqByStatus = getClientReqByStatus;

module.exports.delClientReq = delClientReq;

module.exports.createAccount = createAccount;