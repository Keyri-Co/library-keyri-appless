import EZCrypto from "ezcrypto";

export default async (browserSignatureKeys, rpResponse) => {
  const ezcrypto = new EZCrypto();


    // These are the things that get added and signed to prove validity
    let browserTimestamp = new Date().getTime().toString();
    let browserPublicKey = browserSignatureKeys.publicKey;

    // This is what we will end up signing
    let browserData = btoa(
      JSON.stringify({
        timestamp: browserTimestamp,
        publicKey: browserPublicKey,
        child: rpResponse,
      })
    );

    // Here's our signature
    let browserSignature = await ezcrypto.EcSignData(
      browserSignatureKeys.privateKey,
      browserData
    );

    // This is what we need to somehow hand off to mobile
    return {
      data: browserData,
      signature: browserSignature,
    };


}
