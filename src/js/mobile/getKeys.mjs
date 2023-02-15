import EZindexDB from 'ezindexdb'
import EZCrypto from '@justinwwolcott/ez-web-crypto'


export async function getKeys(){
    
    let database = new EZindexDB()
    let crypto = new EZCrypto();
    let signingKeys;
    let encryptionKeys;

    // Instantiate our connection to the database;
    await database.start('mobile', 'credentials')

    // GET THE KEYS OUT OF THE DATABASE IF THEY ALREADY EXIST
    try {
        signingKeys = await database.reads('credentials', 'signingKeys')
        encryptionKeys = await database.reads('credentials', 'encryptionKeys')
    } catch (e) {
        throw new Error(e);
    }

    // IF THEY DON'T EXIST, CREATE THEM AND STORE THEM IN THE DB
    if (typeof signingKeys == 'undefined') {
        signingKeys = await crypto.EcMakeSigKeys(false)
        signingKeys.id = 'signingKeys'

        encryptionKeys = await crypto.EcMakeCryptKeys(false)
        encryptionKeys.id = 'encryptionKeys'

        try {
            await database.creates('credentials', signingKeys)
            await database.creates('credentials', encryptionKeys)
        } catch (e) {
            throw new Error(e);
        }
    }
    console.log( {signingKeys, encryptionKeys} );
    return {signingKeys, encryptionKeys};
}