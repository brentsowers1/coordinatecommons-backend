const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
  const rCtx = event.requestContext;
  const username = (rCtx.authorizer && rCtx.authorizer.claims && rCtx.authorizer.claims['cognito:username']) ? 
    rCtx.authorizer.claims['cognito:username'] : 
    event.queryStringParameters.username;
  if (!username) {
    errorResponse('No username provided', context.awsRequestId, callback);
  }
  getUserAttributes(username).then((data) => {
    if (data && data.Item && data.Item.Username) {
      console.log('Got user attributes');
      let responseItem = data.Item;
      if (event.queryStringParameters.username) {
        // We don't want to return all preferences if this is a public, unauthenticated request. Only return
        // the attributes needed for public requests.
        responseItem = {
          Username: data.Item.Username,
          UserId: data.Item.UserId,
          AllowPublicAccess: data.Item.AllowPublicAccess
        };
      }
      successResponse(responseItem, callback);
    } else {
      console.warn('No user attributes found for' + username);
      errorResponse('No user attributes found', context.awsRequestId, callback);
    }
  }).catch((err) => {
    console.error(err);
    errorResponse('Error getting user attributes', context.awsRequestId, callback);
  });
};

const getUserAttributes = (username) => {
  const key = {
    Username: username
  };
  return ddb.get({
    TableName: 'UserAttributes',
    Key: key,
    ConsistentRead: true
  }).promise();
};

const successResponse = (userAttributes, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(userAttributes),
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });  
};

const errorResponse = (errorMessage, awsRequestId, callback) => {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
};
