"use strict"

var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var guid =  require('guid');

var redis = require('./redis-module'); 
var smc = require('./server-message-creator');

var templates = {
    user : fs.readFileSync('./app_modules/template/user-template.json', "UTF-8"),
    req_client : fs.readFileSync('./app_modules/template/req_client-template.json', "UTF-8"),
    regExp : {
        email : /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    }
};


//region Private Functions

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

function validEmail(email){
    return templates.regExp.email.test(email);
}

function propertyExists(json, property){
    return json[property] != null
}

function emailInUse(email){
    var result = redis.HEXISTSync('users', email);
    return result;
}

async function addToUserLog(GUID, event, notes){
    try{
        // Get User Logs
        var logs = await redis.HGETSync(GUID, 'logs');
        // Get Event Logs
        var eventLog = JSON.parse(logs);
        // Get Current Time 
        var curTime = Date.now();

        eventLog.log[curTime] = {
            "event" : event,
            "notes" : notes
        }

        var write = await redis.HSETSync(GUID, 'logs', JSON.stringify(eventLog));
        return write;

    } catch(reject) {
        smc.getMessage(0,5,`Error Adding Log to User: ${GUID} - Error: ${reject}`);
        return(false);
    }
}

//endregion Private Functions
//region Exported Methods

function validUser(GUID){
    var result = redis.EXISTSync(GUID);
    return result;
}

function getUser(email){
    var user = redis.HGETSync('users', email);
    return user;
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
            request.req_Date = new Date().getMilliseconds().toString();
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
            var request = JSON.parse(clients[requestID]);
            
            var salt = request.info.client_name.slice(0,5);
            var newName = request.info.client_name.split(' ');
            var now = Date.now();
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

function getUserInfo(GUID){
    return new Promise(async (resolve, reject) => {
        try {
            var user = await redis.HGETALLSync(GUID);
            user != null ? resolve(user) : reject({"Error" : "No User Found", "Method" : "getUserInfo()", "Code" : 2});
        } catch(err) {
            reject({"Error" : err, "Method" : "getUserInfo()", "Code" : 1});
        }
    });
}

function getUserProp(GUID, prop){
    return new Promise(async (resolve, reject) => {
        try {
            var path = prop.split('/')
            var user = await redis.HGETSync(GUID, path[0]);
            if(path.length == 1){
                user != null ? resolve(user) : reject({"Error" : "No User Found", "Method" : "getUserProp()", "Code" : 2});
            } else {
                user = JSON.parse(user);
                for(var i = 1; i < path.length; i++){
                    user = user[path[i]] != null ? user[path[i]] : reject({"Error" : "No User Found", "Method" : "getUserProp()", "Code" : 2});
                }
                typeof user == 'object' ? resolve(JSON.stringify(user)) : resolve(user);
            }
        } catch(err) {
            reject({"Error" : err, "Method" : "getUserProp()", "Code" : 1});
        }
    });
}

function editAccount(GUID, propPath, newValue){
    return new Promise(async (resolve, reject) => {
        try {
            // Get Path of Property
            var path = propPath.split('/');
            // Get Root Property
            var userProp = await redis.HGETSync(GUID, path[0]); 
            var returnVal = false, prevVal;
            // Evaluate if property is a stored object
            if(userProp.split('')[0] == '{'){
                // If it is a JSON Object, parse and update property
                var jsonProp = JSON.parse(userProp);
                if(propertyExists(jsonProp, path[1])) { 
                    jsonProp[path[1]] = newValue;
                    returnVal = await redis.HSETX(GUID, path[0], JSON.stringify(jsonProp));
                }
            } else {
                returnVal = await redis.HSETX(GUID,path[0],newValue);
            }
            if(returnVal){
                var valObj = {
                    'previous_value' : prevVal,
                    'new_value' : newValue
                }
                await addToUserLog(GUID, `Property Update: ${propPath}`, valObj);
            }   
            resolve(returnVal);
        } catch(err) {
            reject({"Error" : err, "Method" : "editAccount()", "Code" : 1});
        }
    });
}

function deleteAccount(GUID){
    return new Promise(async (resolve, reject) => {
        try{
            var user = await redis.HGETALLSync(GUID);
            if(user != null){
                fs.exists('./app_modules/archive', async (err, res) => {
                    if(err){
                        reject({"Error" : err, "Res" : res, "Method" : "deleteAccount()", "Code" : 3});
                    } else if(!res){
                        await fs.mkdirSync('./app_modules/archive');
                    }
                    fs.writeFile(path.join('./app_modules', 'archive', `${GUID}.json`), JSON.stringify(user), async (err, res) => {
                        if(err) {
                           reject({"Error" : err, "Method" : "deleteAccountReq()", "Code" : 4});
                        } else {
                            await redis.HDELSync('users', user.email);
                            redis.client.DEL(GUID, (err, res) => {
                                if(err){
                                    reject({"Error" : err, "Method" : "deleteAccountReq()", "Code" : 5});
                                } else {
                                    resolve(res);
                                }
                            });
                        }
                    });

                });
            } else {
                reject({"Error" : "No User Found", "Method" : "deleteAccount()", "Code" : 2});
            }
        } catch(err) {
            reject({"Error" : err, "Method" : "deleteAccount()", "Code" : 1})
        }
    });
}

//endregion Exported Methods

//region Exports


module.exports.addClientReq = addClientReq;
module.exports.getClientReq = getClientReq;
module.exports.getClientReqByID = getClientReqByID;
module.exports.getClientReqByStatus = getClientReqByStatus;
module.exports.delClientReq = delClientReq;

module.exports.getUser = getUser;
module.exports.validUser = validUser;
module.exports.createAccount = createAccount;
module.exports.editAccount = editAccount;
module.exports.getUserInfo = getUserInfo;
module.exports.getUserProp = getUserProp;
module.exports.deleteAccount = deleteAccount;

module.exports.emailRegEx = templates.regExp.email;

//endregion Exports