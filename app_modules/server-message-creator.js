"use strict"

var fs = require('fs');
var { DEBUG } = require('../index.js');

/**
 * Module designed to output messages to server log.  Used to clean up index.js
 * 
 */
 
/*
 * Status Message Reference:
 * 
 * Server Message:
 *      `${new Date().toUTCString()} - [Server] -`
 * 
 * Database Message: 
 *      `${new Date().toUTCString()} - [Database] - `
 *      `${new Date().toUTCString()} - [Database] - [GET] - `
 *      `${new Date().toUTCString()} - [Database] - [SET] - `
 *      `${new Date().toUTCString()} - [Database] - [DELETE] - `
 * 
 *      `${new Date().toUTCString()} - [Database-Monitor] - `
 * 
 * Error Message:
 *      Minor -> `${new Date().toUTCString()} - [Error] - `
 *      Sever -> `${new Date().toUTCString()} - [ERROR] - `
 *      Crash -> `${new Date().toUTCString()} - [Crash] -
 */
/**
 * Method returns a string formatted with a millisecond timestamp
 * @param {Number} orgin - Reference to originsEnum
 * @param {Number or Null} action - Reference to actionsEnum
 * @param {String} message - Message to be recorded
 */
async function logMessage(orgin, action, message){
    var path = './logs/eventLog.log'
    var now = new Date().toUTCString();
    var log = messageCreate(origin, action, message);
    console.log(log);

    if(!fs.existsSync('./logs')){
        fs.mkdirSync('./logs');
    }

    if(!fs.exsits('./logs/eventLog.log')){
        var header = 
            {  
                'metaData' : {
                    'createDate' : 0,
                    'lastModified' : 0,
                    'logAge': 0,
                },
                'logs' : {
                    now : {
                        'process' : process.pid,
                        'origin' : originsEnum[origin],
                        'action' : actionEnum[action],
                        'message' : message
                    }
                }
            }
        
        fs.writeFileSync()
    } else {
        var logFile = fs.readFileSync('./logs/eventLog.log');
    }
}

/**
 * 
 * @param {Number} origin 
 * @param {Number} action 
 * @param {*} message 
 */
function getMessage( origin, action, message ){
    if(DEBUG){
        logMessage(orgin, action, message)
    } else {
        console.log(messageCreate(origin, action, message));
    }
}

const originsEnum = [
    "[SERVER]",             // 0
    "[DATABASE]",           // 1
    "[DATABASE-MONITOR]",   // 2
    "[ERROR]",              // 3
    "[DEBUG]"               // 4
];

const actionEnum = [
    "[GET]",    // 0
    "[SET]",    // 1
    "[PUT]",    // 2
    "[POST]",   // 3
    "[DELETE]", // 4
    "[ERROR]",  // 5
    "[SAVING]", // 6
    "[NOTICE]", // 7
    "[CRASH]"   // 8 
]

/**
 * 
 * @param {Number} origin 
 * @param {Number} action 
 * @param {*} message 
 */
function messageCreate(origin, action, message){
    var now = new Date().toUTCString();
    if(action != null){       
        return `[${process.pid}] ${now} - ${originsEnum[origin]} - ${actionEnum[action]} - ${message}`;
    }
    else{
        return `[${process.pid}] ${now} - ${originsEnum[origin]} - ${message}`;
    }
}


module.exports.getMessage = getMessage;
module.exports.logMessage = logMessage;