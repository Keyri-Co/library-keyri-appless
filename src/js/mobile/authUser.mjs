import EZCrypto from '@justinwwolcott/ez-web-crypto'
import EZWebAuthn from 'ezwebauthn'
import { postSessionData } from './postSessionData.mjs'
export async function authUser(userParameters, keys, sessionId, sessionData, env, local) {
    //
    // 0.) Instantiate Crypto
    //
    const crypto = new EZCrypto()

    //
    // 1.) Generic Auth Options
    //
    let data = btoa(JSON.stringify({ timestamp: new Date().getTime(), publicKey: keys.signingKeys.publicKey }))
    let signature = await crypto.EcSignData(keys.signingKeys.privateKey, data)
    let challenge = btoa(JSON.stringify({ data, signature, publicKey: keys.signingKeys.publicKey }))

    let authoptions = {
        challenge,
        rpId: document.location.host,
        userVerification: 'discouraged',
        attestation: false,
        timeout: 60000,
        requireResidentKey: true,
    }

    //
    // 2.) WebAuthn Get Auth
    //
    window.focus()
    const ezwebauthn = new EZWebAuthn()
    const authenticatorData = await ezwebauthn.startAuthentication(authoptions)

    //
    // 3.) Verify it with the API
    //
    let output = await fetch('https://c4xfkg8ea4.execute-api.us-east-2.amazonaws.com/prod/v1/browser/verify/', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(authenticatorData),
    }).then(async (data) => {
        return await data.json()
    })

    //
    // Return whatever we got from the API
    //
    if (local === false) {
        //
        // Inform the developwer the type of operation is appless
        //
        output.validationFormat = 'keyri-appless'

        await postSessionData(
            output,
            keys.encryptionKeys.privateKey,
            keys.encryptionKeys.publicKey,
            sessionData,
            sessionId,
            env
        )
    } else {
        return output
    }
}
