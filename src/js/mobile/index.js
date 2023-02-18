import EZWebAuthn from 'ezwebauthn'
import EZCrypto from '@justinwwolcott/ez-web-crypto'
import EZindexDB from 'ezindexdb'
import { getKeys } from './getKeys.mjs'
import { getSessionData } from './getSessionData.mjs'
import { postSessionData } from './postSessionData.mjs'
import { authUser } from './authUser.mjs'
import { webauthRegister } from './webauthRegister.mjs'

// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
//
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
export default class ApplessMobile {
    #database;
    #env;
    #sessionId;
    #radio;
    #local = false;
    #crypto;
    #sessionData;
    #passwordHandler;
    #keys = {
        signingKeys: {},
        encryptionKeys: {},
    };


    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    constructor(env) {
        this.#env = env
        this.#database = new EZindexDB()
        this.#crypto = new EZCrypto()
        this.#radio = document.createDocumentFragment()
    }

    // //////////////////////////////////////////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////////
    //
    on = (t, e) => {
        this.#radio.addEventListener(t, e)
    }

    // //////////////////////////////////////////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////////
    // Internal method to broadcast custom events when needed
    //
    #broadcast = (t, e) => {
        this.#radio.dispatchEvent(
            new CustomEvent(t, {
                detail: e,
            })
        )
    }

    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    register = async (registrationData = false) => {
        return await this.#registerUser({ registration: registrationData })
    }

    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    authenticate = async () => {
        try{
            return await authUser();
        } catch(e){
            console.log({ERROR: e});
        }
    }

    /////////////////////////////////////////////////////////////////////////////
    //
    // This is a function the dev provides. IF we need a password, this is the function
    // that is called to retrieve it from the user
    //
    /////////////////////////////////////////////////////////////////////////////
    set passwordHandler(fx) {
        this.#passwordHandler = fx
    }

    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    start = async (local = false) => {
        this.#local = local
        const { signingKeys, encryptionKeys } = await getKeys()

        this.#keys.signingKeys = signingKeys
        this.#keys.encryptionKeys = encryptionKeys

        if (!this.#local) {

            const { sessionData, sessionId, userParameters } = await getSessionData(signingKeys.publicKey, this.#env);
            this.#sessionId = sessionId;
            this.#sessionData = sessionData;

            if (userParameters?.register == 'true') {
                return await this.#registerUser(userParameters)
            } else {
                try{
                    return await authUser(userParameters, this.#keys, sessionId, sessionData, this.#env, local);
                } catch(e){
                    console.log({ERROR: e});
                }

            }
        }
    }

    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    #registerUser = async (userParameters) => {
        let encrypted = userParameters.registration
        let password

        // If the dev provided a way to get a password from the user, use it
        // otherwise just assume there's a blank password
        if (!this.#passwordHandler) {
            password = ''
        } else {
            password = await this.#passwordHandler()
        }

        // either way, lets try decrypting it
        try {
            userParameters.registration = await this.#crypto.PASSWORD_DECRYPT(password, encrypted.data)
        } catch (e) {
            console.log('DATA DECRYPTION FAILED. WOMP WOMP!', { e })
            throw new Error('PASSWORD DECRYPTION FAILED.')
        }
        //
        // Back to normal
        //
        let registration = JSON.parse(userParameters.registration)
        let browserTwo = JSON.parse(atob(registration.data))
        let rpData = JSON.parse(atob(browserTwo.child.data))
        let browserData = JSON.parse(atob(rpData.child.data))

        // Build the data for mobile to sign
        let mobileData = {
            child: registration,
            publicKey: this.#keys.signingKeys.publicKey,
            timestamp: new Date().getTime(),
        }

        mobileData = btoa(JSON.stringify(mobileData))

        // Sign the data with our mobile key
        let mobileSignature = await this.#crypto.EcSignData(this.#keys.signingKeys.privateKey, mobileData)

        let mobileOut = JSON.stringify({ data: mobileData, signature: mobileSignature })

        console.log({ userParameters, mobileData, browserTwo, rpData, browserData })

        // base64 our mobile data in the normal structure
        userParameters.registration = btoa(mobileOut)

        let authoptions = {
            challenge: userParameters.registration,
            rp: {
                name: rpData.origin,
                id: rpData.origin,
            },
            user: {
                id: rpData.userId,
                name: rpData.userDisplayName,
                displayName: rpData.userDisplayName,
            },
            pubKeyCredParams: [
                {
                    alg: -7,
                    type: 'public-key',
                },
                {
                    alg: -257,
                    type: 'public-key',
                },
            ],
            timeout: 60000,
            attestation: 'none',
            excludeCredentials: [],
            authenticatorSelection: {
                requireResidentKey: true,
                userVerification: 'discouraged',
            },
        }

        // return await this.#webauthRegister({ authoptions, userParameters })
    
        return await webauthRegister({authoptions, userParameters}, this.#keys, this.#sessionData, this.#sessionId, this.#env, this.#local)
    }
    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    #webauthRegister = async (data) => {
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
        if (!this.#local) {
            await postSessionData(
                output,
                this.#keys.encryptionKeys.privateKey,
                this.#keys.encryptionKeys.publicKey,
                this.#sessionData,
                this.#sessionId,
                this.#env
            );
        } else {
            return output
        }
    }


    
}
