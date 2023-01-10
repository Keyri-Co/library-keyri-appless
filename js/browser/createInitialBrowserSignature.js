import EZCrypto from "ezcrypto";

export default async (browserSignatureKeys, metadata) => {
  const ezcrypto = new EZCrypto();

  // //////////////////////////////////////////////////////////////////////////////
  //
  // 1.) THE BROWSER CREATES A PUBLIC KEY, SIGNS IT, AND SHIPS IT TO THE RP
  //
  // //////////////////////////////////////////////////////////////////////////////

  // These are the things that get signed
  let browserTimestamp = new Date().getTime().toString();
  let browserPublicKey = browserSignatureKeys.publicKey;

  // These are the signature and sig-target
  let browserData = btoa(
    JSON.stringify({
      timestamp: browserTimestamp,
      publicKey: browserPublicKey,
      metadata,
    })
  );
  let browserSignature = await ezcrypto.EcSignData(
    browserSignatureKeys.privateKey,
    browserData
  );

  return JSON.stringify({ data: browserData, signature: browserSignature });
};
