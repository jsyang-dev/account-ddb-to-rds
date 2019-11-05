const AWS = require('aws-sdk');
const mysql = require('mysql');
const log = require('./log');
const parse = AWS.DynamoDB.Converter.output;

AWS.config.update({region: 'ap-northeast-2'});

// 암호화된 DB 패스워드
const enc_DB_PWD = process.env.DB_PWD;
let dec_DB_PWD;

const saveToRds = (event) => {
    return new Promise(async (resolve, reject) => {
        // DB 패스워드 복호화
        // if (!dec_DB_PWD) {
        //     // Decrypt code should run once and variables stored outside of the function
        //     // handler so that these are decrypted once per container
        //     const kms = new AWS.KMS();
        //     const data = await kms.decrypt({
        //         CiphertextBlob: new Buffer(enc_DB_PWD, 'base64')
        //     }).promise();
            
        //     dec_DB_PWD = data.Plaintext.toString('ascii');
        // }
        // log.debug(dec_DB_PWD);
        
        // mysql connection
        const con = mysql.createConnection({
            host: process.env.DB_ADDR,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PWD
            // password: dec_DB_PWD
        });
        
        con.connect((err) => {
            if (err) {
                log.error(err, err.stack);
                reject(err);
            }
            log.debug('Connected!');
            
            const dbDefault = process.env.DB_DEFAULT;
            let cnt = 0;
            for (let i = 0, len = event.Records.length; i < len; i++) {
                // newImage data 변환
                let data = {};
                data = parse({'M': event.Records[i].dynamodb.NewImage });
                
                log.debug('data:', JSON.stringify(data, null, 2));
                
                let sql = '';
                if (event.Records[i].eventName == 'INSERT') {
                    // insert query 생성
                    sql = `INSERT INTO ${dbDefault}.account
                            (username,
                            password,
                            name,
                            phone,
                            email)
                            VALUES
                            ('${data.username}',
                            '${data.password }',
                            '${data.name }',
                            '${data.phone }',
                            '${data.email }');`;
                    
                } else if (event.Records[i].eventName == 'MODIFY') {
                    // insert query 생성
                    sql = `UPDATE ${dbDefault}.account
                            SET
                            password = '${data.password}',
                            name = '${data.name}',
                            phone = '${data.phone}',
                            email = '${data.email}'
                            WHERE username = '${data.username}';`;
                }
                    
                log.debug('sql: ', sql);
                con.query(sql, function (err, results, fields) {
                    if (err) {
                        log.error('Error: ', err);
                        con.end();
                        reject(err);
                    } else {
                        log.debug('results: ', results);
                        cnt++;
                    }
                    
                    if (cnt == len) {
                        con.end();
                        resolve();
                    }
                });
            }
        });
    });
};

module.exports = saveToRds;