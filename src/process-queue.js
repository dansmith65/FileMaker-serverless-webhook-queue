'use strict';
const { Filemaker } = require('fms-api-client');
const { connect } = require('marpat');
const queryString = require('query-string');

/**
 * NOTE: Am not trapping errors because they should automatically cause the function to fail and retried again later
 * (like if the server is temporarily offline, for example)
 */

const client = connect('nedb://memory')
    .then(() => {
        return Filemaker.create({
            server: process.env.FMS_SERVER,
            database: process.env.FMS_DATABASE,
            user: process.env.FMS_USER,
            password: process.env.FMS_PASS
        });
    })
    .then(c => {
        return c.save();
    });

exports.handler = function (event, context) {
    event.Records.forEach(record => {
        let messageBody = JSON.parse(record.body);
        let body = messageBody.body;

        console.log(
            messageBody.requestId,
            messageBody.method,
            'path:' + messageBody.path,
            'query:' + (messageBody.queryParams ? queryString.stringify(messageBody.queryParams) : ''),
            'ip:' + messageBody.headers['x-forwarded-for'],
            'userAgent:' + messageBody.headers['user-agent']
        );
        
        // Convert format of body as needed
        if (typeof body == 'undefined') {
            body = '';
        } else if(messageBody.headers['content-type'].startsWith("application/x-www-form-urlencoded")) {
            let parsedBody = queryString.parse(body);
            body = JSON.stringify(parsedBody);
            console.log('body converted from query string to json');
        } else if(typeof body == 'object'){
            body = JSON.stringify(body);
            console.log('body stringified');
        }

        let fmRecord = {
            method: messageBody.method,
            path: messageBody.path,
            queryParams: messageBody.queryParams ? JSON.stringify(messageBody.queryParams) : '',
            headers: messageBody.headers,
            result: body
        };

        client.then(client => {
            client.create('ServerlessWebhookQueue',
                fmRecord,
                {
                    scripts: [
                        { name: 'serverless-webhook-queue'}
                    ]
                }
            )
            .then(response => {
                console.log('FMS response', response);
            })
            .catch(error => {
                console.error('failed to create record in FMS');
                throw error;
            });
        })
        .catch(error => {
            console.error('client failed to resolve before creating record');
            throw error;
        });
    });
};
