export async function postSessionData (data) {
    //
    // 1.) Encrypt some data
    //
    let encryptionData = await this.#crypto.HKDFEncrypt(
        this.#keys.encryptionKeys.privateKey,
        this.#sessionData.browserPublicKey,
        btoa(JSON.stringify(data))
    )

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
            publicKey: this.#keys.encryptionKeys.publicKey,
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
            __salt: this.#sessionData.__salt,
            __hash: this.#sessionData.__hash,
        }),
    }

    //
    // 4.) ...SEND IT
    //
    let postData = await fetch(
        `https://${this.#env}.api.keyri.com/api/v1/session/${this.#sessionId}`,
        postOpts
    ).then(async (data) => {
        return await data.json()
    })

    window.close()
}