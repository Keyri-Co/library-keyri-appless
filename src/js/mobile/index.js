import EZCrypto from '@justinwwolcott/ez-web-crypto'
import EZindexDB from 'ezindexdb'
import { getKeys } from './getKeys.mjs'
import { getSessionData } from './getSessionData.mjs'
import { authUser } from './authUser.mjs'
import { webauthRegister } from './webauthRegister.mjs'

// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
//
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
export default class ApplessMobile {
    #database
    #env
    #sessionId
    #sessionData
    #userParameters;
    #radio
    #local = false
    #crypto

    #keys = {
        signingKeys: {},
        encryptionKeys: {},
    }

    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    constructor(env) {
        this.#env = env
        this.#database = new EZindexDB()
        this.#crypto = new EZCrypto()
        this.#radio = new EventTarget()
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
        try {
            return await authUser(undefined, this.#keys, undefined, undefined, this.#env, undefined)
        } catch (e) {
            console.log({ ERROR: e })
        }
    }

    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    start = async (local = false) => {
        this.#local = local
        const { signingKeys, encryptionKeys } = await getKeys();

        this.#keys.signingKeys = signingKeys
        this.#keys.encryptionKeys = encryptionKeys

        if (!this.#local) {
            const { sessionData, sessionId, userParameters } = await getSessionData(signingKeys.publicKey, this.#env)
            this.#sessionId = sessionId
            this.#sessionData = sessionData
            this.#userParameters = userParameters;
            return {sessionData, sessionId, userParameters};
        }
    }


    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    finish = async (password = "") => {

        if (this.#userParameters?.register == 'true') {
            return await this.#registerUser(this.#userParameters, password);
        } else {
            try {
                return await authUser(this.#userParameters, this.#keys, this.#sessionId, this.#sessionData, this.#env, this.#local)
            } catch (e) {
                console.log({ ERROR: e })
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////////////
    #registerUser = async (userParameters, password) => {

        //
        // Show password
        //
        let encrypted = userParameters.registration;

        console.log({userParameters, password, encrypted});


        // either way, lets try decrypting it
        try {
            userParameters.registration = await this.#crypto.PASSWORD_DECRYPT(password, encrypted.data);
            console.log({registration: userParameters.registration, password, encrypted: encrypted.data});
        } catch (e) {
            console.log('DATA DECRYPTION FAILED. WOMP WOMP!', { e })
            throw new Error('PASSWORD DECRYPTION FAILED.');
            return false;
        }


        //
        // Back to normal
        //
        let registration = JSON.parse(userParameters.registration);
        let browserTwo = JSON.parse(atob(registration.data));
        let rpData = JSON.parse(atob(browserTwo.child.data));
        let browserData = JSON.parse(atob(rpData.child.data));

        console.log({registration, browserTwo, rpData, browserData, password, encrypted, decrypted: userParameters.registration});

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

        return await webauthRegister(
            { authoptions, userParameters },
            this.#keys,
            this.#sessionData,
            this.#sessionId,
            this.#env,
            this.#local
        )
    }
}
