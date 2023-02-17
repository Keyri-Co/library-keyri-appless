export async function getSessionData(publicKey, env) {
    let sessionData
    let userParameters
    //
    // Pull the session ID off the URL we're on
    //
    let queryStringData = Object.fromEntries(Array.from(new URL(document.location).searchParams))

    let sessionId = queryStringData.sessionId

    if (!sessionId) {
        throw new Error('No Session Id Provided')
    }
    //
    // Use headers to communicate with the API so they know who
    // we are...
    //
    let headers = new Headers({'x-mobile-id': publicKey});

    //
    // Options for loading
    //
    let opts = { mode: 'cors', method: 'GET', headers };

    //
    // THIS IS THE STANDARD KEYRI-REST-GET API CALL...
    //
    let url = `https://${env}.api.keyri.com/api/v1/session/${sessionId}`;

    sessionData = await fetch(url, opts);

    if (sessionData?.ok === false) {
        sessionData = await sessionData.json()
        throw new Error(sessionData.message)
    } else {
        sessionData = await sessionData.json()
    }

    //
    // We're ASSUMING this is what's being sent back by our API
    //
    userParameters = atob(sessionData?.userParameters?.base64EncodedData)
    userParameters = JSON.parse(userParameters)

    return { sessionData, userParameters, sessionId }
}
