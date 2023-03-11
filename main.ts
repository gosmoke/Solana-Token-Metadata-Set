import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

/*
To run this program, you must have metaplex-foundation, web3 and anchor installed:

MPL:        npm install @metaplex-foundation/mpl-token-metadata --save
Solana:     MUST INSTALL IN COMMAND PROMPT, RUN AS ADMIN (Google for instructions.)
Anchor:     npm install --save @project-serum/anchor
*/

export function loadWalletKey(keypairFile:string): web3.Keypair {
    const fs = require("fs");
    const loaded = web3.Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString()))
    );
    return loaded;
}

async function main(): Promise<void> {
    console.log("Naming Solana Token Program");

    const INITIALIZE = false;   // If you are creating metadata, set this to true.  If you are updating metadata, set this to false.

    let myKeypair, tokenForMint, imageFilePath, token, secretKeyPath, tokenName, tokenSymbol, connectionRPCAuthority;    

    // ###############################################################################################
    // ##            THESE VARIABLES ARE UNIQUE TO YOUR TOKEN!                                      ##
    // ###############################################################################################

    secretKeyPath = "PRIVATEKEYPATH/id.json";   // If this file is not on your computer, try putting in the byte array directly (see below).
    token = "TOKEN";                            // You must put your token here that you minted with.
    tokenName = "My Test Token";
    tokenSymbol = "MTT";
    imageFilePath = "URL/metadata.json";        // You must put the path to your metadata json file:  shadowndrive, github, etc.

    connectionRPCAuthority = "https://api.mainnet-beta.solana.com";
    //connectionRPCAuthority = "https://api.testnet.solana.com";
    
    // ###############################################################################################

    myKeypair = loadWalletKey(secretKeyPath)

    // If you don't have the private key file on your computer, you can 
    // put in your private bytes below and uncomment out this section. 
    // Example shown is not a valid private key.

    /*
    myKeypair = web3.Keypair.fromSecretKey(
        Uint8Array.from([
            121,70,23,121,67,23,121,90,5,121,45,232,196,11,85,46,192,85,151,72,42,85,226,
            23,105,124,121,23,74,33,85,121,46,50,34,45,142,30,203,202,145,76,59,88,85,120,
            23,99,245,85,204,85,34,121,50,127,121,183,88,85,121,134,61,33
        ])
    );
    */

    tokenForMint = new web3.PublicKey(token);   
    
    const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(tokenForMint.toBytes());
    const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);

    const dataV2 = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: imageFilePath,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    };    

    const accounts = {
        metadata: metadataPDA,
        mint: tokenForMint,
        mintAuthority: myKeypair.publicKey,
        payer: myKeypair.publicKey,
        updateAuthority: myKeypair.publicKey
    };

    let ix;
    if (INITIALIZE) {    
        const args = {
                createMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true
            }
        };

        ix = mpl.createCreateMetadataAccountV2Instruction(accounts, args);
    }
    else {  
        const args = {
            updateMetadataAccountArgsV2: {
                data: dataV2,
                isMutable: true,
                updateAuthority: myKeypair.publicKey,
                primarySaleHappened: true
            }
        };

        ix = mpl.createUpdateMetadataAccountV2Instruction(accounts, args);
    }
    
    const tx = new web3.Transaction();
    tx.add(ix);

    const connection = new web3.Connection(connectionRPCAuthority);
    const txid = await web3.sendAndConfirmTransaction(connection, tx, [myKeypair]);
    
    console.log("Naming Complete");
}

main();
