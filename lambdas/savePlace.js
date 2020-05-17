// This is the lambda to save a place that you've visited, or unvisited. It gets called from the front end. It uses a 
// Cognito UserPool authorizer (configured through the API gateway), so when this is called, the user is authenticated
// and the user details are passed in. It writes or updates a DynamoDB document for the user with all of their 
// places visited.

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
  if (!requestBody.placeId) {
    errorResponse('No place ID specified in request', context.awsRequestId, callback);
    return;
  }
  if (!requestBody.placeType) {
    errorResponse('No place type specified in request', context.awsRequestId, callback);
    return;
  }
  
  getPlacesVisited(userId, requestBody.placeType).then((data) => {
    if (!data || !data.Item || !data.Item.UserId) {
      if (!requestBody.visited) {
        console.log('No document, but the request is to not visit the place, so nothing to do');
        successResponse(username, callback);
      } else {
        console.log('No document exists, writing a new one');
        writeNewPlacesVisitedDocument(userId, requestBody.placeType, requestBody.placeId).then((data) => {
          console.log('Wrote new document');
          successResponse(username, callback);
        }).catch((err) => {
          console.error(err);
          errorResponse('Error writing new document', context.awsRequestId, callback);
        });
      }
    } else {
      const placeInDocument = data.Item.PlacesVisited.find(pv => pv.Id === requestBody.placeId);
      if ( (requestBody.visited && placeInDocument) || (!requestBody.visited && !placeInDocument)) {
        console.log('Didn\'t need to write document');
        successResponse(username, callback);
      } else {
        if (requestBody.visited) {
          data.Item.PlacesVisited.push({Id: requestBody.placeId});
        } else {
          data.Item.PlacesVisited = data.Item.PlacesVisited.filter(pv => pv.Id !== requestBody.placeId);
        }
        updatePlacesVisitedDocument(data.Item).then((rsp) =>{
          console.log('Successfuly updated document');
          successResponse(username, callback);
        }).catch((err) => {
          console.error(err);
          errorResponse('Error updating document', context.awsRequestId, callback);
        });
      }
    }
  }).catch((err) => {
    console.error(err);
    errorResponse('Error getting document', context.awsRequestId, callback);
  });
};

const successResponse = (username, callback) => {
  // do the actual saving
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      username: username
    }),
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

const getPlacesVisited = (userId, placeType) => {
  return ddb.get({
    TableName: 'PlacesVisited',
    Key: {
      UserId: userId,
      PlaceType: placeType
    },
    ConsistentRead: true
  }).promise();
};

const writeNewPlacesVisitedDocument = (userId, placeType, placeId) => {
  return ddb.put({
    TableName: 'PlacesVisited',
    Item: {
      UserId: userId,
      PlaceType: placeType,
      PlacesVisited: [{
        Id: placeId
      }],
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    }
  }).promise();
};

const updatePlacesVisitedDocument = (newDocument) => {
  newDocument.UpdatedAt = new Date().toISOString();
  return ddb.put({
    TableName: 'PlacesVisited',
    Item: newDocument
  }).promise();
}
