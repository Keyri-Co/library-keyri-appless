import EZWebAuthn from "ezwebauthn";
import EZCrypto from "@justinwwolcott/ez-web-crypto";
import EZindexDB from "ezindexdb";

// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
//
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
export default class ApplessMobile {
  #env;
  #appKey;
  #sessionId;

  #local = false;

  #database;
  #crypto;

  #keys = {
    signingKeys: {},
    encryptionKeys: {},
  };

  #sessionData;

  #onPasswordRequest;

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  constructor(env, appKey) {

    this.#env = env;
    this.#appKey = appKey;

    this.#database = new EZindexDB();
    this.#crypto = new EZCrypto();

  }


  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  set onPasswordRequest (fx) {
    console.log(fx.toString());
    this.#onPasswordRequest = fx;
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  start = async(local = false) => {

    this.#local = local;
    this.#database = new EZindexDB();

    //
    // Instantiate our connection to the database;
    //
    await this.#database.start("mobile", "credentials");

    // ////////////////////////////////////////////////////////
    // GET THE KEYS OUT OF THE DATABASE IF THEY ALREADY EXIST
    // ////////////////////////////////////////////////////////

    let signingKeys;
    let encryptionKeys;

    try {
      signingKeys = await this.#database.reads("credentials", "signingKeys");
      encryptionKeys = await this.#database.reads(
        "credentials",
        "encryptionKeys"
      );
    } catch (e) {}

    // ////////////////////////////////////////////////////////
    // IF THEY DON'T EXIST, CREATE THEM AND STORE THEM IN THE DB
    // ////////////////////////////////////////////////////////
    if (typeof signingKeys == "undefined") {
      signingKeys = await this.#crypto.EcMakeSigKeys(false);
      signingKeys.id = "signingKeys";

      encryptionKeys = await this.#crypto.EcMakeCryptKeys(false);
      encryptionKeys.id = "encryptionKeys";

      try {
        await this.#database.creates("credentials", signingKeys);
        await this.#database.creates("credentials", encryptionKeys);
      } catch (e) {
        console.error("INDEXDB ERROR", e);
      }
    }

    this.#keys.signingKeys = signingKeys;
    this.#keys.encryptionKeys = encryptionKeys;

    if(!this.#local){
      return await this.#getSessionData();
    }


  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  register = async (registrationData = false) => {
    // ////////////////////////////////////////////////////////
    // IF WE'RE ON A MOBILE DATA, GET DATA OUT OF THE REST INFO
    // ////////////////////////////////////////////////////////
      return await this.#registerUser({registration: registrationData})

  };


  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  authenticate = async () => {
    return await this.#authUser();
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  #getSessionData = async () => {
    //
    // Pull the session ID off the URL we're on
    //
    let queryStringData = Object.fromEntries(
      Array.from(new URL(document.location).searchParams)
    );

    this.#sessionId = queryStringData.sessionId;
    //
    // Use headers to communicate with the API so they know who
    // we are...
    //
    let headers = new Headers({
      "x-mobile-id": this.#keys.signingKeys.publicKey,
    });

    //
    // Options for loading
    //
    let opts = {
      mode: "cors",
      method: "GET",
      headers,
    };

    //
    // THIS IS THE STANDARD KEYRI-REST-GET API CALL...
    //
    this.#sessionData = await fetch(
      `https://${this.#env}.api.keyri.com/api/v1/session/${
        this.#sessionId
      }?appKey=${this.#appKey}`,
      opts
    ).then(async (data) => {
      return await data.json();
    });

    //
    // Since we're really in Dev, throw all of this junk onto the 
    // screen
    //
    console.log(this.#sessionData);

    //
    // We're ASSUMING this is what's being sent back by our API
    //
    let userParameters = atob(
      this.#sessionData?.userParameters?.base64EncodedData
    );
    userParameters = JSON.parse(userParameters);

    if (userParameters?.register == "true") {
      return await this.#registerUser(userParameters);
    } else {
      return await this.#authUser(userParameters);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  #registerUser = async (userParameters) => {
    let encrypted = userParameters.registration;
    let password;

    // If the dev provided a way to get a password from the user, use it
    // otherwise just assume there's a blank password
    if(!this.#onPasswordRequest){
      password = "";
    } else {
      password = await this.#onPasswordRequest();
    }

    // either way, lets try decrypting it
    try{
      userParameters.registration = await this.#crypto.PASSWORD_DECRYPT(password, encrypted.data);
    } catch(e) {
      console.log("DATA DECRYPTION FAILED. WOMP WOMP!",{e});
      throw new Error("PASSWORD DECRYPTION FAILED.");
    }
    //
    // Back to normal
    //
    let registration = JSON.parse(userParameters.registration);
    let browserTwo = JSON.parse(atob(registration.data));
    let rpData = JSON.parse(atob(browserTwo.child.data));
    let browserData = JSON.parse(atob(rpData.child.data));

    // Build the data for mobile to sign
    let mobileData = {
      child: registration,
      publicKey: this.#keys.signingKeys.publicKey,
      timestamp: new Date().getTime()
    }

    mobileData = btoa(JSON.stringify(mobileData));

    // Sign the data with our mobile key
    let mobileSignature = await this.#crypto.EcSignData(
      this.#keys.signingKeys.privateKey,
      mobileData
    );

    let mobileOut = JSON.stringify({data: mobileData, signature: mobileSignature});

    console.log({userParameters, mobileData, browserTwo, rpData, browserData });

    // base64 our mobile data in the normal structure
    userParameters.registration = btoa(mobileOut);

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
          type: "public-key",
        },
        {
          alg: -257,
          type: "public-key",
        }
      ],
      timeout: 60000,
      attestation: "none",
      excludeCredentials: [],
      authenticatorSelection: {
        requireResidentKey: true,
        userVerification: "none",
      },
    };

    return await this.#webauthRegister({ authoptions, userParameters});

  };
  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  #webauthRegister = async (data) => {
    //
    // Do Client Side WebAuthn
    //
    const ezwebauthn = new EZWebAuthn();

    window.focus();
    let userParameters = data.userParameters;
    let authoptions = data?.authoptions;
    let authenticatorData = await ezwebauthn.startRegistration(authoptions);

    console.log({passKey: authenticatorData});

    let output = await fetch(
      "https://c4xfkg8ea4.execute-api.us-east-2.amazonaws.com/prod/v1/browser/register/",
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authenticatorData,
          userParameters,
        }),
      }
    ).then(async (data) => {
      return await data.json();
    });

    //
    // Return whatever we got from the API
    //
    if(!this.#local){
      await this.#postSessionData(output);
    } else {
      return output;
    }
  };












  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  #authUser = async (userParameters) => {

    //
    // 1.) Generic Auth Options
    //
    let data = btoa(JSON.stringify({"timestamp": new Date().getTime(), "publicKey": this.#keys.signingKeys.publicKey}));
    let signature = await this.#crypto.EcSignData(this.#keys.signingKeys.privateKey, data);
    let challenge = btoa(JSON.stringify({data, signature, publicKey: this.#keys.signingKeys.publicKey}));

    let authoptions = {
      challenge,
      rpId: document.location.origin.replace(/^.*?\/\//, ""),
      userVerification: "discouraged",
      timeout: 60000,
      requireResidentKey: true,
    };


    //
    // 2.) WebAuthn Get Auth
    //
    window.focus();
    const ezwebauthn = new EZWebAuthn();
    const authenticatorData = await ezwebauthn.startAuthentication(authoptions);

    //
    // 3.) Verify it with the API
    //
    let output = await fetch(
        "https://c4xfkg8ea4.execute-api.us-east-2.amazonaws.com/prod/v1/browser/verify/",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(authenticatorData),
        }
      ).then(async (data) => {
        return await data.json();
      });




    //
    // Return whatever we got from the API
    //
    if(!this.#local){
      //
      // Inform the developwer the type of operation is appless
      //
      output.validationFormat = "keyri-appless";
      await this.#postSessionData(output);
    } else {
      return output;
    }

  };

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  #webauthAuthenticate = async (data) => {
    //
    // Return whatever we got from the API
    //
    await this.#postSessionData(data);
  };

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  #postSessionData = async (data) => {
    //
    // 1.) Encrypt some data
    //
    let encryptionData = await this.#crypto.HKDFEncrypt(
      this.#keys.encryptionKeys.privateKey,
      this.#sessionData.browserPublicKey,
      btoa(JSON.stringify(data))
    );

    //
    // 2.) Build out the POST object
    //
    let postBody = {
      apiData: {
        associationKey: "WEBSOCKET-TEST-SCRIPT",
        publicUserId: "public-User-ID",
      },
      browserData: {
        ...encryptionData,
        publicKey: this.#keys.encryptionKeys.publicKey,
      },
      errorMsg: "",
      errors: false,
    };

    //
    // 3.) Add to the POST body, with salt and hash
    //
    let postOpts = {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        ...postBody,
        __salt: this.#sessionData.__salt,
        __hash: this.#sessionData.__hash,
      }),
    };

    //
    // 4.) ...SEND IT
    //
    let postData = await fetch(
      `https://${this.#env}.api.keyri.com/api/v1/session/${this.#sessionId}`,
      postOpts
    ).then(async (data) => {
      return await data.json();
    });

    window.close();
  };
}
