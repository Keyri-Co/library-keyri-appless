import EZCrypto from '@justinwwolcott/ez-web-crypto'

export async function postSessionData(data, myPrivateKey, myPublicKey, sessionData, sessionId, env) {
    //
    // 0.) Instantiate EZCrypto
    //
    const crypto = new EZCrypto();

    //
    // 1.) Encrypt some data
    //
    let encryptionData = await crypto.HKDFEncrypt(myPrivateKey, sessionData.browserPublicKey, btoa(JSON.stringify(data)))

    //
    // 2.) Build out the POST object
    //
    let postBody = {
        apiData: {
            associationKey: 'WEBSOCKET-TEST-SCRIPT',
            publicUserId: 'public-User-ID',
        },
        browserData: {
            ...encryptionData,
            publicKey: myPublicKey,
        },
        errorMsg: '',
        errors: false,
    }

    //
    // 3.) Add to the POST body, with salt and hash
    //
    let postOpts = {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
            ...postBody,
            __salt: sessionData.__salt,
            __hash: sessionData.__hash,
        }),
    }

    //
    // 4.) ...SEND IT
    //
    let postData = await fetch(`https://${env}.api.keyri.com/api/v1/session/${sessionId}`, postOpts).then(
        async (data) => {
            return await data.json()
        }
    )

    window.close()
}
