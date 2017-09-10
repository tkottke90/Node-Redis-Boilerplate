"use strict"

var client;

module.exports = {

    client,

    /**
     * Synchronus function gets number of values in set.
     * @param {string} key Name of the set key in Redis
     * @returns {Proimse<number, Error>} If promise is fulfilled, return number of values.  If Promise is rejected, return error.
     */
    SCARDSync(key){
        return new Promise((resolve, reject) => {
            client.SCARD(key,(err, res) => {
                if(err){
                    smc.getMessage(1,0,`SCARDSync Error: ${err}`);
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    },

}