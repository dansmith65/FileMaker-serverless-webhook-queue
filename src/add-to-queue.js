'use strict';
const AWS = require('aws-sdk');
const {Base64} = require('js-base64');

const sqs = new AWS.SQS({
    apiVersion: 'latest',
    region: process.env.AWS_REGION,
});

exports.handler = async function(event, context) {
    console.log(
        event.requestContext.requestId,
        event.requestContext.http.method,
        'path:' + event.pathParameters.path,
        'query:' + event.rawQueryString,
        'ip:' + event.requestContext.http.sourceIp,
        'userAgent:' + event.requestContext.http.userAgent
    )

    if (event.rawPath.endsWith('favicon.ico')) {
        return {
            statusCode: 404
        };
    }

    let body = event.body;
    if (event.isBase64Encoded) {
        body = Base64.decode(body);
        //console.log('Base64 decoded body');
    }

    // Try to convert body to JSON to object, so it's not stringified twice
    try {
        body = JSON.parse(body);
        //console.log('body was json');
    } catch(e) {
        body = body;
        //console.log('body was not json');
    }

    let messageBody = {
        requestId: event.requestContext.requestId,
        method: event.requestContext.http.method,
        path: event.pathParameters.path,
        queryParams: event.queryStringParameters,
        headers: event.headers,
        body
    };

    // Send a message into SQS
    await sqs.sendMessage({
        QueueUrl: process.env.QUEUE_URL,
        MessageGroupId: 'default',
        MessageBody: JSON.stringify(messageBody),
    }).promise();

    // Expected from most webhooks to confirm receipt
    return {
        statusCode: 204
    };
}
