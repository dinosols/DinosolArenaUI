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
    //createGameMetadataInstruction,
    joinBattleInstruction,
    chooseTeamMemberInstruction,
    enterBattleInstruction,
    //submitActionInstruction,
    //updateStatsInstruction,
    //updateInstruction,
} from '../../instructions';
import { sendTransactionPhantom } from '../../transactions';
import {
    //createRandomGameMetadataArgs,
    getBattlePDA, getMetadataPDA //, mintToken,
} from '../../accounts';
import {
    //Stats,
    //Move,
    JoinBattleArgs,
    CreateBattleArgs,
    ChooseTeamMemberArgs,
    //SubmitActionArgs,
    BATTLE_SCHEMA,
    GAME_METADATA_SCHEMA,
    decodeBattle,
    //CreateGameMetadataArgs,
    decodeMetadata,
    EnterBattleArgs,
    //UpdateStatsArgs,
    //UpdateArgs,
} from '../../schema';

const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const GAME_METADATA_PUBKEY = new PublicKey("4iqJsF4JLz8iLuvMxYvHchtG3wqiZdsNEp1EGPphKVXw");
const BATTLE_PUBKEY = new PublicKey("7c3qcZxkby5jNCUx2ghQraLtrpM1aSR3V3vSWcgmorZS");

function OpponentGeneration(props) {

    const [loading, setLoading] = useState(true);
    const [preAnim, setPreAnim] = useState(true);

    useEffect(() => {
        console.log("useEffect");

        // Create a battle here?
        // TODO: Check if this is the right spot.
        fetchDinoMeta(props.playerdino).then(async function (playerMeta) {
            console.log(playerMeta);

            if (playerMeta.battleAuthority.toString() === PublicKey.default.toString()) {
                // Create a battle because one does not yet exist.
                console.log("Create a battle because one does not yet exist.");
                await createBattle(props);
            }
            else {
                // Resume an already entered battle.
                console.log("Resume an already entered battle.");
                props.battleupdater(new PublicKey(playerMeta.battleAuthority));
            }

            let connection = new Connection("https://api.devnet.solana.com");
            const battlePubKey = props.battleaccount;
            const battleAccountInfo = await connection.getAccountInfo(battlePubKey);
            const battle = decodeBattle(battleAccountInfo.data);
            console.log(battle);

            let player;
            if (battle.player_1.wallet.toString() === window.solana.publicKey.toString()) {
                console.log('Am player 1');
                if (battle.player_2.active_team_member === 0) {
                    player = battle.player_2.team_member0;
                }
                else if (battle.player_2.active_team_member === 0) {
                    player = battle.player_2.team_member1;
                }
                else if (battle.player_2.active_team_member === 0) {
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
                else if (battle.player_1.active_team_member === 0) {
                    player = battle.player_1.team_member1;
                }
                else if (battle.player_1.active_team_member === 0) {
                    player = battle.player_1.team_member2;
                }
                else {
                    console.log("Should never happen");
                }
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
                dinosolId: player,
                dinosolImage: data.image,
                dinosolLevel: gamemeta.level,
                dinosolName: metadata.data.data.name,
                dinosolAttacks: [
                    {
                        attackDamage: gamemeta.currStats.attack,
                        attackEffect: gamemeta.move0.status_effect,
                        attackName: moveIdToName(gamemeta.move0.move_id),
                        criticalChance: 0,
                        effectChance: gamemeta.move0.status_effect_chance,
                    },
                    {
                        attackDamage: gamemeta.currStats.attack,
                        attackEffect: gamemeta.move1.status_effect,
                        attackName: moveIdToName(gamemeta.move1.move_id),
                        criticalChance: 0,
                        effectChance: gamemeta.move1.status_effect_chance,
                    },
                    {
                        attackDamage: gamemeta.currStats.attack,
                        attackEffect: gamemeta.move2.status_effect,
                        attackName: moveIdToName(gamemeta.move2.move_id),
                        criticalChance: 0,
                        effectChance: gamemeta.move2.status_effect_chance,
                    },
                    {
                        attackDamage: gamemeta.currStats.attack,
                        attackEffect: gamemeta.move3.status_effect,
                        attackName: moveIdToName(gamemeta.move3.move_id),
                        criticalChance: 0,
                        effectChance: gamemeta.move3.status_effect_chance,
                    },
                ],
            };

            props.opponentupdater(opponent);
            setLoading(false);
            setPreAnim(false);
            props.viewupdate(2);
        });
        // setTimeout(() => {
        //     const opponent = {
        //         "dinosolId": "9006",
        //         "dinosolName": "Opponentsaurus Rex",
        //         "dinosolImage": "https://dinosols.app/images/Dino_dubya.png",
        //         "dinosolHP": 200,
        //         "dinosolLevel": 41,
        //         "dinosolExperience": 5000,
        //         "prevExpThreshold": 3000,
        //         "nextLevelExp": 6000,
        //         "dinosolAttacks": [
        //             {
        //                 "attackName": "Bite",
        //                 "attackDamage": 15,
        //                 "attackEffect": null,
        //                 "effectChance": 0,
        //                 "criticalChance": 0.15
        //             },
        //             {
        //                 "attackName": "Bite",
        //                 "attackDamage": 15,
        //                 "attackEffect": null,
        //                 "effectChance": 0,
        //                 "criticalChance": 0.15
        //             },
        //             {
        //                 "attackName": "Bite",
        //                 "attackDamage": 15,
        //                 "attackEffect": null,
        //                 "effectChance": 0,
        //                 "criticalChance": 0.15
        //             },
        //             {
        //                 "attackName": "Bite",
        //                 "attackDamage": 15,
        //                 "attackEffect": null,
        //                 "effectChance": 0,
        //                 "criticalChance": 0.15
        //             }
        //         ],
        //         "dinosolBattleRecord": []
        //     };
        //     props.opponentupdater(opponent);
        //     setLoading(false);
        //     setTimeout(() => {
        //         setPreAnim(false);

        //         setTimeout(() => {
        //             props.viewupdate(2);
        //         }, 5000);
        //     }, 30);
        // }, 5000);
    }, []);

    function renderView() {
        let viewJsx = null;

        if (loading) {
            viewJsx = <h1>Waiting for a Challenger...</h1>;
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

async function fetchDinoMeta(dinoAddress) {
    let connection = new Connection("https://api.devnet.solana.com");
    const metaPubKey = await getMetadataPDA(new PublicKey(dinoAddress), GAME_METADATA_PUBKEY);
    const gameMetadataInfo = await connection.getAccountInfo(metaPubKey);
    const gameMeta = decodeMetadata(gameMetadataInfo.data);
    //console.log(gameMeta);
    return gameMeta;
}

async function createBattle(props) {
    console.log(props);
    console.log(props.battleaccount === null)

    let connection = new Connection("https://api.devnet.solana.com");
    //const walletKeyPair = loadWalletKey(window.solana.publicKey);
    let instructions = [];
    // Create Battle
    let battleAccount;

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
    } catch {
        // ignore
    }

    // Force wait for max confirmations
    await connection.getParsedConfirmedTransaction(res.txid, 'confirmed');

    const battleAccountInfo = await connection.getAccountInfo(battleAccount);
    const battle = decodeBattle(battleAccountInfo.data);
    console.log(battle);

    props.battleupdater(battleAccount);
    //console.log("Battle:\n" + JSON.stringify(battle, null, 2));
}

async function getGameMetadata(token) {
    let connection = new Connection("https://api.devnet.solana.com");

    let [metadataAccount, bump] = await PublicKey.findProgramAddress([
        Buffer.from("gamemeta"),
        GAME_METADATA_PUBKEY.toBuffer(),
        new PublicKey(token).toBuffer(),
    ], GAME_METADATA_PUBKEY);

    //console.log(metadataAccount.toString());

    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);
    const metadata = decodeMetadata(metadataAccountInfo.data);
    console.log(metadata);
    return metadata;
}

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
    }

    return name;
}

export default OpponentGeneration;