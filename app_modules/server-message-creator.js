"use strict"

var fs = require('fs');

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

module.exports = {

    /**
     * Method returns a string formatted with a millisecond timestamp
     * @param {Number} orgin - Reference to originsEnum
     * @param {Number or Null} action - Reference to actionsEnum
     * @param {String} message - Message to be recorded
     */
    async logMessage(orgin, action, message){
        var now = new Date().toUTCString();
        var log = messageCreate(origin, action, message);
        console.log(log);

        if(!fs.existsSync('./logs')){
            fs.mkdirSync('./logs');
        }

        if(!fs.exsits('./logs/eventLog')){
            var header = 
                {  
                    'metaData' : {
                        'createDate' : 0,
                        'lastModified' : 0,
                        'logAge': 0,
                    },
                    'logs' : {
                        now : {
                            'origin' : origin,
                            'action' : action,
                            'message' : message
                        }
                    }
                }
            
            fs.writeFileSync
        }
    },

    /**
     * 
     * @param {Number} origin 
     * @param {Number} action 
     * @param {*} message 
     */
    getMessage( origin, action, message ){
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
        return `${now} - ${originsEnum[origin]} - ${actionEnum[action]} - ${message}`;
    }
    else{
        return `${now} - ${originsEnum[origin]} - ${message}`;
    }
}
