This is the back end code for the Coordinate Commons application (https://www.coordinatecommons.com/app)

It's still in the very early stages. Read https://www.coordinatecommons.com/app and click About in the top bar for more infomation on what Coordinate Commons is.

From a technical perspective - this repo is a collection of lambda functions for saving/retrieving data for the coordinate commons application. Right now, there's just one lambda that doesn't save, but I'll be adding saving to DynamoDB soon. Users and login sessions are managed with AWS Cognito. The lambdas are called through API Gateway with a Cognito Authorizor in the middle.  The front end is a lot further along than this back end. The front end is a React application that uses Google Maps and calls the lambdas here. See the front end code at https://github.com/brentsowers1/coordinatecommons-frontend.

I'm doing this to get more hands on coding experience with React, and more hands on experience with lambdas, node, and AWS technologies. I am a software engineering manager, and have written much code in my years. In the past 5+ years I've managed teams that are building functionality in React, and have managed teams that are doing a few things with lambdas. But I only have a little direct hands on experience coding myself with React, and haven't build any lambdas myself, so I'm doing this project to learn more about those technologies, and to have some fun coding! 

To read more about me, visit https://www.coordinatecommons.com.

