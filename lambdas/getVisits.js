const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
  const userId = event.requestContext.authorizer.claims['sub'];
  const placeType = event.queryStringParameters.placeType;
  getPlacesVisited(userId, placeType).then((data) => {
    if (data && data.Item && data.Item.UserId) {
      console.log('Got a document');
      successResponse(data.Item.PlacesVisited, callback);
    } else {
      console.log('No document found');
      successResponse([], callback);
    }
  }).catch((err) => {
    console.error(err);
    errorResponse('Error getting visits', context.awsRequestId, callback);
  })
};

const getPlacesVisited = (userId, placeType) => {
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

const successResponse = (placesVisited, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      placesVisited: placesVisited
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
