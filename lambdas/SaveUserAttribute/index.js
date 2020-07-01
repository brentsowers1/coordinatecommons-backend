// This is the lambda to save an attribute to the current user. It gets called from the front end. It uses a 
// Cognito UserPool authorizer (configured through the API gateway), so when this is called, the user is authenticated
// and the user details are passed in. It writes or updates a DynamoDB document with this info.

// Note that this does NOT yet deploy... I just put the code in the lambda editor. I tried using SAM and Cloudformation for
// deploying, but put this on hold for now to focus on getting application functionality working. The inline editor, and
// manually configuring everything through AWS console works fine while my application is very small.

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
  if (!event.requestContext.authorizer) {
    errorResponse('Authorization not configured', context.awsRequestId, callback);
    return;
  }
  
  const username = event.requestContext.authorizer.claims['cognito:username'];
  const userId = event.requestContext.authorizer.claims['sub'];
  const requestBody = JSON.parse(event.body);
  
  getUserAttributes(username).then((data) => {
    let userAttributes;
    if (!data || !data.Item || !data.Item.Username) {
      userAttributes = {
        Username: username,
        UserId: userId,
        CreatedAt: new Date().toISOString()
      };
    } else {
      userAttributes = data.Item; 
    }
    const allowedAttributes = ['AllowPublicAccess', 'LastLogin'];
    allowedAttributes.forEach((allowedAttribute) => {
      if (requestBody && requestBody[allowedAttribute] !== undefined) {
        userAttributes[allowedAttribute] = requestBody[allowedAttribute];
      }
    });
    writeUserAttributes(userAttributes).then((data) => {
      console.log('Wrote user attributes');
      successResponse(callback);
    }).catch((err) => {
      console.error(err);
      errorResponse('Error writing user attributes document', context.awsRequestId, callback);
    });
  }).catch((err) => {
    console.error(err);
    errorResponse('Error getting document', context.awsRequestId, callback);
  });
};

const successResponse = (callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({}),
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

const getUserAttributes = (username) => {
  return ddb.get({
    TableName: 'UserAttributes',
    Key: {
      Username: username
    },
    ConsistentRead: true
  }).promise();
};

const writeUserAttributes = (userAttributes) => {
  userAttributes.UpdatedAt = new Date().toISOString();
  return ddb.put({
    TableName: 'UserAttributes',
    Item: userAttributes
  }).promise();
}
