const log = require('./log');
const saveToRds = require('./saveToRds');

const proc = (event) => {
    return new Promise(async (resolve, reject) => {
        
        try {
            let cnt = 0;
        
            // INSERT/MODIFY 존재 여부 확인
            for (let i = 0, len = event.Records.length; i < len; i++) {
                if (event.Records[i].eventName == 'INSERT' || event.Records[i].eventName == 'MODIFY') {
                    cnt++;
                }
            }
        
            log.info('Record cnt: ', cnt);
            if (cnt > 0) {
                await saveToRds(event);
            }
            
            resolve('success');

        } catch (e) {
            reject(e);
        }
    });
};

module.exports = proc;