// Note that this does NOT yet deploy... I just put the code in the lambda editor. I need to work on a deployment system.
// And it does NOT yet save to a database. I want to hook this up to DynamoDB. But for now all that it does is return the 
// logged in user name and the passed in place ID. The validation that you're authenticated happens through API gateway
// having an authorizor configured to a cognito pool.

// To call this lambda, you must pass a header of Authorization: token
// where token is the Cognito ID token's jwt token value. You can get this through a login call through cognito. Or snoop
// on the response when logging in to https://www.coordinatecommons.com/app

exports.handler = (event, context, callback) => {
  if (!event.requestContext.authorizer) {
    errorResponse('Authorization not configured', context.awsRequestId, callback);
    return;
  }
  
  const username = event.requestContext.authorizer.claims['cognito:username'];
  const requestBody = JSON.parse(event.body);
  if (!requestBody.placeId) {
    errorResponse('No place ID specified in request', context.awsRequestId, callback);
    return;
  }
  
  // do the actual saving
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      username: username,
      placeId: requestBody.placeId
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
};

function errorResponse(errorMessage, awsRequestId, callback) {
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
}

