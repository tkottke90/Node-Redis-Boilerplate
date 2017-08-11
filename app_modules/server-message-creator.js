"use strict"

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
    logMessage(orgin, action, message){
        var now = new Date().valueOf();
        if(action != null){
            return `${now} - ${originsEnum[origin]} - ${action} - ${message}`;
        }
        else{
            return `${now} - ${originsEnum[origin]} - ${message}`;
        }
    },

    /**
     * 
     * @param {Number} origin 
     * @param {Number} action 
     * @param {*} message 
     */
    getMessage( origin, action, message ){
        var now = new Date().toUTCString();
        if(action != null){       
            console.log(`${now} - ${originsEnum[origin]} - ${actionEnum[action]} - ${message}`);
            return `${now} - ${originsEnum[origin]} - ${actionEnum[action]} - ${message}`;
        }
        else{
            console.log(`${now} - ${originsEnum[origin]} - ${message}`);
            return `${now} - ${originsEnum[origin]} - ${message}`;
        }
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
    "[CRASH]",  // 8 
]
