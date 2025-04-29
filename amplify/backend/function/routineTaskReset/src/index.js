/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	AUTH_TASTIN56E9908D_USERPOOLID
	API_TASTINAPI_GRAPHQLAPIIDOUTPUT
	API_TASTINAPI_GRAPHQLAPIENDPOINTOUTPUT
	API_TASTIN_GRAPHQLAPIENDPOINTOUTPUT
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    return {
        statusCode: 200,
    //  Uncomment below to enable CORS requests
    //  headers: {
    //      "Access-Control-Allow-Origin": "*",
    //      "Access-Control-Allow-Headers": "*"
    //  },
        body: JSON.stringify('Hello from Lambda!'),
    };
};
