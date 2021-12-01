import React, { useState } from 'react';

import { PublicKey, Connection } from '@solana/web3.js';
import { serialize } from 'borsh';

import { getGameMetadata } from '../../helpers';
import { getMetadataPDA } from '../../accounts';
import { decodeMetadata, Stats, UpdateStatsArgs, EnterBattleArgs, GAME_METADATA_SCHEMA } from "../../schema";
import { updateStatsInstruction, enterBattleInstruction } from '../../instructions';
import { sendTransactionPhantom } from '../../transactions';

const GAME_METADATA_PUBKEY = new PublicKey("4iqJsF4JLz8iLuvMxYvHchtG3wqiZdsNEp1EGPphKVXw");

function DevMenu(props) {
    const [metaText, setMetaText] = useState("");

    getMeta(props.dinomap, setMetaText);

    if (metaText === "") {
        return null;
    }
    else {
        return (
            <div id="devmenu-container">
                <div id="devmenu-text-container">
                    <div id="devmenu-title-container">
                        <h1>Dinosol Kingdom</h1>
                    </div>
                    <ul id="devmenu-menu-options">
                        <li className="devmenu-option" onClick={async () => { await heal(props, setMetaText, getMeta) }} >Heal</li><br />
                        <li className="devmenu-option" onClick={async () => { await resetBattle(props, setMetaText, getMeta) }} >Reset Battle</li><br />
                        <li className="devmenu-option" onClick={props.viewupdate.bind(null, 0)} >Exit</li><br />
                    </ul>
                    <textarea id="devmenu-textarea" disabled>
                        {metaText}
                    </textarea>
                </div>
            </div>
        );
    }
}

async function heal(props, setMetaText, getMeta) {
    // TODO: Single env somewhere.
    let connection = new Connection("https://api.devnet.solana.com");
    let instructions = [];

    console.log(props);

    for (const [key, value] of Object.entries(props.dinomap)) {
        console.log(key);
        const playerMetaPDA = await getMetadataPDA(new PublicKey(key), GAME_METADATA_PUBKEY)
        const metaAccountInfo = await connection.getAccountInfo(playerMetaPDA);
        const metadata = decodeMetadata(metaAccountInfo.data);

        const newStats = new Stats({
            health: metadata.levelStats.health,
            attack: metadata.currStats.attack,
            defense: metadata.currStats.defense,
            speed: metadata.currStats.speed,
            agility: metadata.currStats.agility,
            rage_points: metadata.currStats.rage_points,
        });

        const statsArgs =
            new UpdateStatsArgs({
                stats: newStats,
            });

        let statsTxnData = Buffer.from(
            serialize(
                GAME_METADATA_SCHEMA,
                statsArgs,
            ),
        );

        instructions.push(
            updateStatsInstruction(
                playerMetaPDA,
                window.solana.publicKey,
                statsTxnData,
                GAME_METADATA_PUBKEY,
            ),
        );
    }

    const res = await sendTransactionPhantom(
        connection,
        window.solana,
        instructions,
    );

    try {
        await connection.confirmTransaction(res.txid, 'max');
    } catch (e) {
        console.log(e);
    }

    // Force wait for max confirmations
    await connection.getParsedConfirmedTransaction(res.txid, 'confirmed');

    setMetaText("");
    getMeta(props.dinomap, setMetaText);
}

async function resetBattle(props, setMetaText, getMeta) {
    // TODO: Single env somewhere.
    let connection = new Connection("https://api.devnet.solana.com");
    let instructions = [];

    console.log(props);
    for (const [key, value] of Object.entries(props.dinomap)) {
        const playerMetaPDA = await getMetadataPDA(new PublicKey(key), GAME_METADATA_PUBKEY);
        const enterBattleArgs =
            new EnterBattleArgs({
                battle_authority: PublicKey.default.toString(),
            });

        let battleTxnData = Buffer.from(
            serialize(
                GAME_METADATA_SCHEMA,
                enterBattleArgs,
            ),
        );
        instructions.push(
            enterBattleInstruction(
                window.solana.publicKey,
                playerMetaPDA,
                window.solana.publicKey,
                battleTxnData,
                GAME_METADATA_PUBKEY,
            ),
        );
    }

    const res = await sendTransactionPhantom(
        connection,
        window.solana,
        instructions,
    );

    try {
        await connection.confirmTransaction(res.txid, 'max');
    } catch (e) {
        console.log(e);
    }

    // Force wait for max confirmations
    await connection.getParsedConfirmedTransaction(res.txid, 'confirmed');

    setMetaText("");
    getMeta(props.dinomap, setMetaText);
}

async function getMeta(dinomap, setMetaText) {
    let text = "";
    for (const [key, value] of Object.entries(dinomap)) {
        text += JSON.stringify(await getGameMetadata(new PublicKey(key)), null, 2);
    }
    setMetaText(text);
    console.log("Text: " + text);
}

export default DevMenu;