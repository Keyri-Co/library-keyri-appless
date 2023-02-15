export async function getSessionData(publicKey, env, appKey) {

    //
    // Pull the session ID off the URL we're on
    //
    let queryStringData = Object.fromEntries(Array.from(new URL(document.location).searchParams))

    let sessionId = queryStringData.sessionId
    //
    // Use headers to communicate with the API so they know who
    // we are...
    //
    let headers = new Headers({
        'x-mobile-id': publicKey,
    })

    //
    // Options for loading
    //
    let opts = {
        mode: 'cors',
        method: 'GET',
        headers,
    }

    //
    // THIS IS THE STANDARD KEYRI-REST-GET API CALL...
    //
    let sessionData = await fetch(
        `https://${env}.api.keyri.com/api/v1/session/${sessionId}?appKey=${appKey}`,
        opts
    ).then(async (data) => {
        return await data.json()
    })

    //
    // We're ASSUMING this is what's being sent back by our API
    //
    let userParameters = atob(sessionData?.userParameters?.base64EncodedData)
    userParameters = JSON.parse(userParameters);

    console.log("MODULE", {sessionData, userParameters});

    return {userParameters, sessionId};
}
