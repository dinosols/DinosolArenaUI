import { PublicKey, Connection } from '@solana/web3.js';
import { decodeMetadata } from "./schema";

const GAME_METADATA_PUBKEY = new PublicKey("4iqJsF4JLz8iLuvMxYvHchtG3wqiZdsNEp1EGPphKVXw");

// TODO: Hacked in Enum converter until we build the Enum into the schema.
function moveIdToName(move_id) {
    let name = "";
    switch (move_id) {
        case 0:
            name = "";
            break;
        case 1:
            name = "Slash";
            break;
        case 2:
            name = "Bite";
            break;
        case 3:
            name = "PackHunt";
            break;
        case 4:
            name = "Bite";
            break;
        case 5:
            name = "Crush";
            break;
        case 6:
            name = "GroupTear";
            break;
        case 7:
            name = "Claw";
            break;
        case 8:
            name = "Drop";
            break;
        case 9:
            name = "Swarm";
            break;
        case 10:
            name = "Stab";
            break;
        case 11:
            name = "Charge";
            break;
        case 12:
            name = "Herd Defense";
            break;
        case 13:
            name = "Laser";
            break;
        default:
            name = "";
    }

    return name;
}

async function getGameMetadata(token) {
    // TODO: We should use a global connection and/or a single defintion of which env to use.
    let connection = new Connection("https://api.devnet.solana.com");

    // Grab the Game Metadata PDA.
    let [metadataAccount, bump] = await PublicKey.findProgramAddress([
        Buffer.from("gamemetav1"),
        GAME_METADATA_PUBKEY.toBuffer(),
        new PublicKey(token).toBuffer(),
    ], GAME_METADATA_PUBKEY);

    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);
    const metadata = decodeMetadata(metadataAccountInfo.data);
    console.log(metadata);
    return metadata;
}

export {moveIdToName, getGameMetadata};