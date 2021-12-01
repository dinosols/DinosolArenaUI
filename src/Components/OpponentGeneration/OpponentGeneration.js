import React, { useState, useEffect } from 'react';
import DinoCard from './DinoCard';

import {
    //Keypair,
    Connection,
    //SystemProgram,
    //TransactionInstruction,
    PublicKey,
} from '@solana/web3.js';
import { programs } from '@metaplex/js';
import { serialize } from 'borsh';

import {
    createBattleInstruction,
    joinBattleInstruction,
    chooseTeamMemberInstruction,
    enterBattleInstruction,
} from '../../instructions';
import { sendTransactionPhantom } from '../../transactions';
import {
    //createRandomGameMetadataArgs,
    getBattlePDA, getMetadataPDA //, mintToken,
} from '../../accounts';
import {
    JoinBattleArgs,
    CreateBattleArgs,
    ChooseTeamMemberArgs,
    BATTLE_SCHEMA,
    GAME_METADATA_SCHEMA,
    decodeBattle,
    decodeMetadata,
    EnterBattleArgs,
} from '../../schema';
import { moveIdToName } from "../../helpers";

const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const GAME_METADATA_PUBKEY = new PublicKey("4iqJsF4JLz8iLuvMxYvHchtG3wqiZdsNEp1EGPphKVXw");
const BATTLE_PUBKEY = new PublicKey("7c3qcZxkby5jNCUx2ghQraLtrpM1aSR3V3vSWcgmorZS");

function OpponentGeneration(props) {

    const [loading, setLoading] = useState(true);
    const [preAnim, setPreAnim] = useState(true);

    useEffect(() => {
        // Create a battle here?
        // TODO: Check if this is the right spot.
        getOpponent(props).then(opponent => {

            props.opponentupdater(opponent);
            setLoading(false);
            setPreAnim(false);
            props.viewupdate(2);
        });
    }, []);

    function renderView() {
        let viewJsx = null;

        if (loading) {
            let battleAccount;
            if (props.battleaccount)
            {
                battleAccount = props.battleaccount.toString();
            }
            else
            {
                battleAccount = "";
            }
            viewJsx = (
                <>
                    <h1>Waiting for a Challenger...</h1>
                    <h3>Battle ID: {battleAccount}</h3>
                </>
            );
        } else {
            console.log(props.playerdino);
            console.log(props.dinomap[props.playerdino]);
            viewJsx = (
                <>
                    <div id="player-card" className="dino-card-div" style={determineOffset(true)}>
                        <DinoCard dino={props.dinomap[props.playerdino]} />
                    </div>
                    <h1 id="vs-text">VS</h1>
                    <div id="opponent-card" className="dino-card-div" style={determineOffset(false)}>
                        <DinoCard dino={props.opponentdino} />
                    </div>
                </>
            );
        }

        return viewJsx;
    }

    function determineOffset(isPlayer) {
        let offset = 0;
        if (preAnim) {
            offset = 1000 * (isPlayer ? -1 : 1);
        }

        return {
            transform: `translateX(${offset}px)`
        }
    }

    return (
        <div id="opponent-generation-container" className="section-container">
            {
                renderView()
            }
        </div>
    );
}

async function getOpponent(props) {
    let playerMeta = await fetchDinoMeta(props.playerdino)
    console.log(playerMeta);
    let battleAccount;

    if (playerMeta.battleAuthority.toString() === PublicKey.default.toString()) {
        // Create a battle because one does not yet exist.
        console.log("Create a battle because one does not yet exist.");
        battleAccount = await createBattle(props);
    }
    else {
        // Resume an already entered battle.
        console.log("Resume an already entered battle.");
        //props.battleupdater(new PublicKey(playerMeta.battleAuthority));
        battleAccount = new PublicKey(playerMeta.battleAuthority);
        props.battleupdater(battleAccount);
    }
    //console.log(playerMeta.battleAuthority);
    //console.log(props.battleaccount);

    console.log(battleAccount.toString());

    let connection = new Connection("https://api.devnet.solana.com");
    const battlePubKey = battleAccount;

    let player = PublicKey.default;
    while (player.toString() === PublicKey.default.toString()) {
        const battleAccountInfo = await connection.getAccountInfo(battlePubKey);
        const battle = decodeBattle(battleAccountInfo.data);
        console.log(battle);
        if (battle.player_1.wallet.toString() === window.solana.publicKey.toString()) {
            console.log('Am player 1');
            if (battle.player_2.active_team_member === 0) {
                player = battle.player_2.team_member0;
            }
            else if (battle.player_2.active_team_member === 1) {
                player = battle.player_2.team_member1;
            }
            else if (battle.player_2.active_team_member === 2) {
                player = battle.player_2.team_member2;
            }
            else {
                console.log("Should never happen");
            }
        }
        else if (battle.player_2.wallet.toString() === window.solana.publicKey.toString()) {
            console.log('Am player 2');
            if (battle.player_1.active_team_member === 0) {
                player = battle.player_1.team_member0;
            }
            else if (battle.player_1.active_team_member === 1) {
                player = battle.player_1.team_member1;
            }
            else if (battle.player_1.active_team_member === 2) {
                player = battle.player_1.team_member2;
            }
            else {
                console.log("Should never happen");
            }
        }
        else {
            console.log("Should also never happen.");
        }

        console.log(player.toString());
    }

    let [metadataAccount, bump] = await PublicKey.findProgramAddress([
        Buffer.from("metadata"),
        METADATA_PUBKEY.toBuffer(),
        new PublicKey(player).toBuffer(),
    ], METADATA_PUBKEY);

    let metadata;
    try {
        metadata = await programs.metadata.Metadata.load(connection, metadataAccount)
    } catch (e) {
        console.log(e);
    }

    let gamemeta = await getGameMetadata(player);
    let metadataData = await fetch(metadata.data.data.uri);
    let data = await metadataData.json();

    const opponent = {
        dinosolBattleRecord: [],
        nextLevelExp: 0,
        prevExpThreshold: 0,
        dinosolExperience: gamemeta.experience,
        dinosolHP: gamemeta.currStats.health,
        dinosolMaxHP: gamemeta.levelStats.health,
        dinosolId: player,
        dinosolImage: data.image,
        dinosolLevel: gamemeta.level,
        dinosolName: metadata.data.data.name,
        dinosolAttacks: [
            {
                attackDamage: gamemeta.currStats.attack,
                attackEffect: gamemeta.moves[0].status_effect,
                attackName: gamemeta.moves[0].move_name,
                criticalChance: 0,
                effectChance: gamemeta.moves[0].status_effect_chance,
            },
            {
                attackDamage: gamemeta.currStats.attack,
                attackEffect: gamemeta.moves[1].status_effect,
                attackName: gamemeta.moves[1].move_name,
                criticalChance: 0,
                effectChance: gamemeta.moves[1].status_effect_chance,
            },
            {
                attackDamage: gamemeta.currStats.attack,
                attackEffect: gamemeta.moves[2].status_effect,
                attackName: gamemeta.moves[2].move_name,
                criticalChance: 0,
                effectChance: gamemeta.moves[2].status_effect_chance,
            },
            {
                attackDamage: gamemeta.currStats.attack,
                attackEffect: gamemeta.moves[3].status_effect,
                attackName: gamemeta.moves[3].move_name,
                criticalChance: 0,
                effectChance: gamemeta.moves[3].status_effect_chance,
            },
        ],
    };

    //props.battleupdater(battleAccount);
    return opponent;
}

async function fetchDinoMeta(dinoAddress) {
    let connection = new Connection("https://api.devnet.solana.com");
    const metaPubKey = await getMetadataPDA(new PublicKey(dinoAddress), GAME_METADATA_PUBKEY);
    const gameMetadataInfo = await connection.getAccountInfo(metaPubKey);
    const gameMeta = decodeMetadata(gameMetadataInfo.data);
    return gameMeta;
}

async function createBattle(props) {
    console.log(props);
    console.log(props.battleaccount === null)

    // TODO: Single env instance somewhere
    let connection = new Connection("https://api.devnet.solana.com");
    let instructions = [];
    // Create Battle
    let battleAccount;

    // If a battleaccount has not already been set (via Join Battle) then create a new battle.
    if (props.battleaccount === null) {
        // Generate Date String
        var today = new Date();
        var ss = String(today.getMinutes()).padStart(2, '0');
        var mm = String(today.getSeconds()).padStart(2, '0');
        var hh = String(today.getHours()).padStart(2, '0');
        var DD = String(today.getDate()).padStart(2, '0');
        var MM = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var YYYY = today.getFullYear();

        const dateString = YYYY + "-" + MM + "-" + DD + " " +
            hh + ":" + mm + ":" + ss;

        battleAccount = await getBattlePDA(window.solana.publicKey, BATTLE_PUBKEY, dateString);

        const createBattleArgs =
            new CreateBattleArgs({
                date: dateString,
            });

        let createTxnData = Buffer.from(
            serialize(
                BATTLE_SCHEMA,
                createBattleArgs,
            ),
        );

        instructions.push(
            createBattleInstruction(
                battleAccount,
                PublicKey.default,
                window.solana.publicKey,
                window.solana.publicKey,
                window.solana.publicKey,
                createTxnData,
                BATTLE_PUBKEY,
            ),
        );
    }
    else {
        battleAccount = props.battleaccount;
    }

    props.battleupdater(battleAccount);
    console.log("Battle Account is " + battleAccount);

    // Join the battle
    const joinBattleArgs =
        new JoinBattleArgs({
        });

    let joinTxnData = Buffer.from(
        serialize(
            BATTLE_SCHEMA,
            joinBattleArgs,
        ),
    );

    console.log("Player Dino");
    console.log(props.playerdino);
    let playerPubkey = new PublicKey(props.playerdino);
    instructions.push(
        joinBattleInstruction(
            battleAccount,
            window.solana.publicKey,
            playerPubkey,
            playerPubkey,
            playerPubkey,
            window.solana.publicKey,
            joinTxnData,
            BATTLE_PUBKEY,
        ),
    );

    let dinoMetaPDA = await getMetadataPDA(playerPubkey, GAME_METADATA_PUBKEY);
    const enterBattleArgs =
        new EnterBattleArgs({
            battle_authority: battleAccount.toString(),
        });

    let txnData = Buffer.from(
        serialize(
            GAME_METADATA_SCHEMA,
            enterBattleArgs,
        ),
    );
    instructions.push(
        enterBattleInstruction(
            window.solana.publicKey,
            dinoMetaPDA,
            window.solana.publicKey,
            txnData,
            GAME_METADATA_PUBKEY,
        ),
    );

    const p1TeamMemberArgs =
        new ChooseTeamMemberArgs({
            index: 0,
        });

    let p1TxnData = Buffer.from(
        serialize(
            BATTLE_SCHEMA,
            p1TeamMemberArgs,
        ),
    );

    instructions.push(
        chooseTeamMemberInstruction(
            battleAccount,
            window.solana.publicKey,
            window.solana.publicKey,
            p1TxnData,
            BATTLE_PUBKEY,
        ),
    );

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

    const battleAccountInfo = await connection.getAccountInfo(battleAccount);
    const battle = decodeBattle(battleAccountInfo.data);
    console.log(battle);
    return battleAccount;
}

async function getGameMetadata(token) {
    // TODO: Single env instance.
    let connection = new Connection("https://api.devnet.solana.com");

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

export default OpponentGeneration;