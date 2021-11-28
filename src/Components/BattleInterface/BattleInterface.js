import React, { useEffect, useState } from 'react';
import "../../animate.css";
import "../../bootstrap.css";
import "../../App.scss";
import TextBox from "./TextBox";
import Attacks from "./Attacks";
import EnemyBox from "./EnemyBox";
import PlayerBox from "./PlayerBox";
import PlayAgain from "./PlayAgain";

import {
    enterBattleInstruction,
    chooseTeamMemberInstruction,
    submitActionInstruction,
    updateStatsInstruction,
    updateInstruction,
} from '../../instructions';
import { sendTransactionPhantom } from '../../transactions';
import {
    Stats,
    Move,
    ChooseTeamMemberArgs,
    SubmitActionArgs,
    BATTLE_SCHEMA,
    GAME_METADATA_SCHEMA,
    decodeBattle,
    decodeMetadata,
    UpdateStatsArgs,
    UpdateArgs,
    EnterBattleArgs,
} from '../../schema';
import {
    Connection,
    PublicKey,
} from '@solana/web3.js';
import { serialize } from 'borsh';
import { getMetadataPDA } from '../../accounts';

const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const GAME_METADATA_PUBKEY = new PublicKey("4iqJsF4JLz8iLuvMxYvHchtG3wqiZdsNEp1EGPphKVXw");
const BATTLE_PUBKEY = new PublicKey("7c3qcZxkby5jNCUx2ghQraLtrpM1aSR3V3vSWcgmorZS");

function BattleInterface(props) {
    const [gameOver, setGameOver] = useState(false);
    const [playerHP, setPlayerHP] = useState(0);
    const [playerFaint, setPlayerFaint] = useState(null);
    const [enemyHP, setEnemyHP] = useState(0);
    const [enemyFaint, setEnemyFaint] = useState(null);
    const [textMessageOne, setTextMessageOne] = useState("");
    const [textMessageTwo, setTextMessageTwo] = useState("");

    useEffect(() => {
        setPlayerHP(props.dinomap[props.player].dinosolHP);
        setEnemyHP(props.opponent.dinosolHP);
        startingSequence();
    }, []);

    function startingSequence() {
        console.log("Starting Sequence");
        setTimeout(() => {
            setTextMessageOne(`${props.opponent.dinosolName} has entered the battle!`);
            setEnemyFaint(false);
            setTimeout(() => {

                setTextMessageOne(`Go ${props.dinomap[props.player].dinosolName}!`);
                setPlayerFaint(false);
                setTimeout(() => {
                    chooseTeamMember(props).then(() => { setTextMessageOne(""); });
                }, 3000);
            }, 3000);
        }, 1000);
    };

    async function enemyTurn(playerPubkey, opponentPubkey, playerMetaPDA, opponentMetaPDA) {
        let connection = new Connection("https://api.devnet.solana.com");
        let instructions = [];
        let enemyMoved = false;

        while (!enemyMoved) {
            const battlePubKey = props.battleaccount;
            const battleAccountInfo = await connection.getAccountInfo(battlePubKey);
            const battle = decodeBattle(battleAccountInfo.data);

            console.log(battle);
            let opponentMove;
            if (battle.player_1.wallet.toString() === window.solana.publicKey.toString()) {
                console.log("Waiting for player 2 to move.");
                opponentMove = battle.player_2.current_move;
            }
            else if (battle.player_2.wallet.toString() === window.solana.publicKey.toString()) {
                console.log("Waiting for player 1 to move.");
                opponentMove = battle.player_1.current_move;
            }

            if (opponentMove) {
                enemyMoved = (opponentMove.move_id !== 0);
            }
            console.log(JSON.stringify(opponentMove));
        }

        console.log("Opponent has moved!");

        let playerMeta = await getGameMetadata(playerPubkey.toString());
        let opponentMeta = await getGameMetadata(opponentPubkey.toString());

        const new_stats = new Stats({
            health: Math.max(0, playerMeta.currStats.health - opponentMeta.currStats.attack),
            attack: playerMeta.currStats.attack,
            defense: playerMeta.currStats.defense,
            speed: playerMeta.currStats.speed,
            agility: playerMeta.currStats.agility,
        });

        const newStatsArgs =
            new UpdateStatsArgs({
                stats: new_stats,
            });

        let statsTxnData = Buffer.from(
            serialize(
                GAME_METADATA_SCHEMA,
                newStatsArgs,
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

        let updateArgs =
            new UpdateArgs({});
        let updateTxnData = Buffer.from(
            serialize(
                BATTLE_SCHEMA,
                updateArgs,
            )
        );

        instructions.push(
            updateInstruction(
                props.battleaccount,
                playerMetaPDA,
                opponentMetaPDA,
                window.solana.publicKey,
                updateTxnData,
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

        instructions = [];

        let bothMovesDone = false;
        while (!bothMovesDone) {
            const battlePubKey = props.battleaccount;
            const battleAccountInfo = await connection.getAccountInfo(battlePubKey);
            const battle = decodeBattle(battleAccountInfo.data);

            console.log(battle);

            if (battle.player_1.current_move.move_id === 0 && battle.player_2.current_move.move_id === 0) {
                bothMovesDone = true;
            }
        }

        playerMeta = await getGameMetadata(playerPubkey.toString());
        opponentMeta = await getGameMetadata(opponentPubkey.toString());
        setPlayerHP(playerMeta.currStats.health);
        setEnemyHP(opponentMeta.currStats.health);

        if (opponentMeta.currStats.health === 0) {
            console.log("Entered Enemy Faint Phase");
            setTextMessageOne(`${props.opponent.dinosolName} fainted.`);
            setTextMessageTwo(`${props.dinomap[props.player].dinosolName} wins!`);
            setEnemyFaint(true);

            await endBattle(connection, playerMetaPDA);
            setTimeout(() => {
                setGameOver(true);
            }, 3000);
        } else if (playerMeta.currStats.health === 0) {
            console.log("Entered Player Faint Phase");
            setTextMessageOne(`${props.dinomap[props.player].dinosolName} fainted.`);
            setTextMessageTwo(`${props.opponent.dinosolName} wins!`);
            setPlayerFaint(true);

            await endBattle(connection, playerMetaPDA);
            setTimeout(() => {
                setGameOver(true);
            }, 3000);
        }
        setTextMessageOne("");
        setTextMessageTwo("");
    };

    function handleAttackClick(name, damage) {
        // TODO: Single env instance.
        let connection = new Connection("https://api.devnet.solana.com");
        let instructions = [];

        setTextMessageOne(`${props.dinomap[props.player].dinosolName} used ${name} for ${damage} damage!`);
        
        let playerdino = props.dinomap[props.player]
        console.log("Player Pubkey: " + playerdino.dinosolId);
        console.log("Opponent Pubkey: " + props.opponent.dinosolId);

        let playerPubkey = new PublicKey(playerdino.dinosolId);
        let opponentPubkey = new PublicKey(props.opponent.dinosolId);
        getGameMetadata(playerPubkey).then(metadata => {

            let newMove;
            if (name === playerdino.dinosolAttacks[0].attackName) {
                newMove = metadata.move0;
            } else if (name === playerdino.dinosolAttacks[1].attackName) {
                newMove = metadata.move1;
            } else if (name === playerdino.dinosolAttacks[2].attackName) {
                newMove = metadata.move2;
            } else if (name === playerdino.dinosolAttacks[3].attackName) {
                newMove = metadata.move3;
            } else {
                console.log("Invalid move selected.");
            }

            console.log("Selected Move: " + JSON.stringify(newMove));

            const p1MoveArgs =
                new SubmitActionArgs({
                    move: new Move(newMove),
                });

            let p1TxnData = Buffer.from(
                serialize(
                    BATTLE_SCHEMA,
                    p1MoveArgs,
                ),
            );

            getMetadataPDA(playerPubkey, GAME_METADATA_PUBKEY).then(playerMetaPDA => {
                getMetadataPDA(opponentPubkey, GAME_METADATA_PUBKEY).then(opponentMetaPDA => {
                    instructions.push(
                        submitActionInstruction(
                            props.battleaccount,
                            window.solana.publicKey,
                            playerMetaPDA,
                            opponentMetaPDA,
                            GAME_METADATA_PUBKEY,
                            window.solana.publicKey,
                            p1TxnData,
                            BATTLE_PUBKEY,
                        ),
                    );

                    try {
                        sendTransactionPhantom(
                            connection,
                            window.solana,
                            instructions,
                        ).then(res => {

                            connection.confirmTransaction(res.txid, 'max').then(() => {
                                // Force wait for max confirmations
                                connection.getParsedConfirmedTransaction(res.txid, 'confirmed').then(() => {
                                    // once the state is changed, start enemy turn
                                    enemyTurn(playerPubkey, opponentPubkey, playerMetaPDA, opponentMetaPDA).then(() => { return; });
                                });
                            });
                        });
                    } catch (e) {
                        console.log(e);
                        // ignore
                    }
                });
            });
        });
    };

    return (
        <div className=" battle-container" >
            <div className="row row justify-content-center align-items-center" >
                <div className="col-sm-12" > { /* BATTLE SCREEN CONTAINER */}
                    <div id="battle-container" className="px-2 mx-auto" >
                        <EnemyBox enemyName={props.opponent.dinosolName}
                            enemyLevel={props.opponent.dinosolLevel}
                            enemyHP={enemyHP}
                            enemyMaxHP={props.opponent.dinosolMaxHP}
                            enemyFaint={enemyFaint}
                            enemyRank={props.opponent.enemyRank}
                            dinoimage={props.opponent.dinosolImage}
                        />
                        <PlayerBox playerName={props.dinomap[props.player].dinosolName}
                            playerLevel={props.dinomap[props.player].dinosolLevel}
                            playerHP={playerHP}
                            playerMaxHP={props.dinomap[props.player].dinosolMaxHP}
                            playerFaint={playerFaint}
                            playerRank={props.dinomap[props.player].playerRank}
                            dinoimage={props.dinomap[props.player].dinosolImage}
                        />

                        { /* TEXT BOX SECTION */}
                        <div id="text-box" >
                            <div id="text-box-content" >
                                {
                                    textMessageOne !== "" &&
                                    gameOver === false && (
                                        <TextBox messageOne={textMessageOne}
                                            messageTwo={textMessageTwo}
                                        />
                                    )
                                }
                                {
                                    textMessageOne === "" &&
                                    gameOver === false &&
                                    Object.keys(props.dinomap[props.player].dinosolAttacks).map((key, index) => {
                                        return (
                                            <Attacks
                                                key={key}
                                                index={index}
                                                details={props.dinomap[props.player].dinosolAttacks[key]}
                                                handleAttackClick={handleAttackClick}
                                            />
                                        );
                                    })
                                }
                                {
                                    gameOver === true && (
                                        <PlayAgain handlePlayAgain={props.viewupdate.bind(null, 0)} />
                                    )
                                }
                            </div>
                        </div>
                        { /* END TEXT BOX SECTION */}
                    </div>
                    { /* END BATTLE SCREEN CONTAINER */}
                </div>
            </div>
        </div>
    );
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

async function chooseTeamMember(props) {
    // TODO: Single env somewhere.
    let connection = new Connection("https://api.devnet.solana.com");
    let instructions = [];
    // Choose Team Members (in this case the first dino)
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
            props.battleaccount,
            window.solana.publicKey,
            window.solana.publicKey,
            p1TxnData,
            BATTLE_PUBKEY,
        ),
    );

    try {
        sendTransactionPhantom(
            connection,
            window.solana,
            instructions,
        ).then(res => {
            connection.confirmTransaction(res.txid, 'max').then(() => {
                // Force wait for max confirmations
                connection.getParsedConfirmedTransaction(res.txid, 'confirmed');
            });
        });
    } catch (e) {
        console.log(e);
    }
}

async function endBattle(connection, playerMetaPDA) {
    let instructions = [];

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

    const metaAccountInfo = await connection.getAccountInfo(playerMetaPDA);
    const metadata = decodeMetadata(metaAccountInfo.data);

    const newStats = new Stats({
        health: metadata.levelStats.health,
        attack: metadata.currStats.attack,
        defense: metadata.currStats.defense,
        speed: metadata.currStats.speed,
        agility: metadata.currStats.agility,
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
}

export default BattleInterface;

//container h-100

//h-100