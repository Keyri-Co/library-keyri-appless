export async function webauthRegister(data, keys, sessionData, sessionId, env) {
    {
        //
        // Do Client Side WebAuthn
        //
        const ezwebauthn = new EZWebAuthn()

        window.focus()
        let userParameters = data.userParameters
        let authoptions = data?.authoptions
        let authenticatorData = await ezwebauthn.startRegistration(authoptions)

        let output = await fetch('https://c4xfkg8ea4.execute-api.us-east-2.amazonaws.com/prod/v1/browser/register/', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                authenticatorData,
                userParameters,
            }),
        }).then(async (data) => {
            return await data.json()
        })

        //
        // Return whatever we got from the API
        //
        if (!local) {
            await postSessionData(
                output,
                keys.encryptionKeys.privateKey,
                keys.encryptionKeys.publicKey,
                sessionData,
                sessionId,
                env
            );
        } else {
            return output
        }
    }
}