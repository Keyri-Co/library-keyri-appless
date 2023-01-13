import EZCrypto from "@justinwwolcott/ez-web-crypto";
import createInitialBrowserSignature from "./createInitialBrowserSignature.js";
import createFinalBrowserSignature from "./createFinalBrowserSignature.js";

export default class ApplessBrowser {
  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  register = async (url, metadata, password) => {

    console.log({url, metadata, password});

    const ezcrypto = new EZCrypto();
    const browserSignatureKeys = await ezcrypto.EcMakeSigKeys(false);

    //
    // 1.) THE BROWSER CREATES A PUBLIC KEY, SIGNS IT, AND SHIPS IT TO THE RP
    //
    let initialBrowserSignatureData = await createInitialBrowserSignature(
      browserSignatureKeys,
      metadata
    );

    //
    // 2.) THROUGH THE METADATA - RP LEARNS WHO USER IS. THEY RETURN A SIGNED OBJECT
    //     WITH THE USER'S REAL ID
    //
    let options = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: initialBrowserSignatureData,
    };

    let rpResponse = await fetch(url, options).then(async (data) => {
      return data.json();
    });

    //
    // 3.) BROWSER GETS IT, SIGNS IT, SENDS IT TO MOBILE VIA IFRAME,WebSockets, AND ¡MAGIC!
    //
    let returnValue = await createFinalBrowserSignature(browserSignatureKeys, rpResponse);
    //
    //    return {
    //      data: browserData,
    //      signature: browserSignature,
    //    };
    //

    if(password){
      returnValue.encrypted = true;
      returnValue.data = await ezcrypto.PASSWORD_ENCRYPT(password, returnValue.data);
    }

    return returnValue;
  };
}
