/**
 * Author: @yangjs
 * Date 2019.11.04
 */

const proc = require('./lib/proc');
const log = require('./lib/log');

let callback = null;

function success(data) {
    callback(null, data);
}

function fail(e) {
    callback(e);
}

const execute = async (event, context, cb) => {
    // timezone 변경
    process.env.TZ = 'Asia/Seoul';
    log.debug('env:', JSON.stringify(process.env, null, 2));

    callback = cb;
    log.debug('received event:', JSON.stringify(event, null, 2));

    try {
        // Main logic
        const result = await proc(event);
        log.info('result:', JSON.stringify(result, null, 2));
        success(result);
        
    } catch (e) {
        fail(e);
    }
};

process.on('unhandledRejection', (reason, p) => {
    log.error('reason: ', reason);
    log.error('p: ', p);
    throw reason;
});

process.on('uncaughtException', (e) => {
    log.error('uncaughtException: ', e);
    log.error(e);
});

exports.handler = execute;