const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
  const rCtx = event.requestContext;
  const userId = (rCtx.authorizer && rCtx.authorizer.claims && rCtx.authorizer.claims['sub']) ? 
    rCtx.authorizer.claims['sub'] : 
    event.queryStringParameters.sub;
  if (!userId) {
    errorResponse('No sub provided', context.awsRequestId, callback);
  }
  const placeType = event.queryStringParameters ? event.queryStringParameters.placeType : null;
  if (placeType) {
    getPlacesVisitedByType(userId, placeType).then((data) => {
      if (data && data.Item && data.Item.UserId) {
        successResponse({
          placesVisited: data.Item.PlacesVisited
        }, callback);
      } else {
        console.log('No document found');
        successResponse({placesVisited: []}, callback);
      }
    }).catch((err) => {
      console.error(err);
      errorResponse('Error getting visits', context.awsRequestId, callback);
    });
  } else {
    getAllPlacesVisited(userId).then((data) => {
      if (data && data.Items) {
        successResponse({places: data.Items}, callback);
      } else {
        successResponse({places: []}, callback);
      }
    }).catch((err) => {
      console.error(err);
      errorResponse('Error getting visits', context.awsRequestId, callback);
    });
  }
};

const getPlacesVisitedByType = (userId, placeType) => {
  const key = {
    UserId: userId,
    PlaceType: placeType
  };
  return ddb.get({
    TableName: 'PlacesVisited',
    Key: key,
    ConsistentRead: true
  }).promise();
};

const getAllPlacesVisited = (userId) => {
  return ddb.query({
    TableName: 'PlacesVisited',
    KeyConditionExpression: 'UserId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ProjectionExpression: 'PlacesVisited, PlaceType',
    ConsistentRead: true
  }).promise();
};


const successResponse = (responseBody, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(responseBody),
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
