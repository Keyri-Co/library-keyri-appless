import EZCrypto from "@justinwwolcott/ez-web-crypto";
import createInitialBrowserSignature from "./createInitialBrowserSignature.js";
import createFinalBrowserSignature from "./createFinalBrowserSignature.js";

export default class ApplessBrowser {
  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  register = async (url, metadata, password) => {

    //
    // 0.) FINE! We're using passwords for everything
    //     
    //
    if(!password){
      password = "";
    }

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
    // 3.) BROWSER GETS IT, SIGNS IT
    //
    let returnValue = await createFinalBrowserSignature(browserSignatureKeys, rpResponse);

    //
    // 4.) NOW WE ENCRYPT IT SO IT DOESN'T GET INTERCEPTED
    //
    returnValue = btoa(JSON.stringify(returnValue));

    returnValue = await ezcrypto.PASSWORD_ENCRYPT(password, returnValue);

    return {encrypted: true, data: returnValue};
  };
}
