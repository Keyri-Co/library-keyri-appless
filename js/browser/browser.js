import EZCrypto from "@justinwwolcott/ez-web-crypto";
import createInitialBrowserSignature from "./createInitialBrowserSignature.js";
import createFinalBrowserSignature from "./createFinalBrowserSignature.js";

export default class ApplessBrowser {
  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
  register = async (url, metadata) => {
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
    return await createFinalBrowserSignature(browserSignatureKeys, rpResponse);
  };
}
