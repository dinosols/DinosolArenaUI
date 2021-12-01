import React, { useEffect, useState } from "react";
import { PublicKey, Connection } from '@solana/web3.js';
//const solana = require('@solana/web3.js');
//const buffer = require('buffer');
import { programs } from '@metaplex/js';
//const metaplex = require('@metaplex/js')
import "./animate.css";
import "./bootstrap.css";
import "./App.scss";
import Home from "./Components/Home/Home";
import DinoPen from "./Components/DinoPen/DinoPen";
import Leaderboard from "./Components/Leaderboard/Leaderboard";
import DinoSelection from "./Components/DinoSelection/DinoSelection";
import OpponentGeneration from "./Components/OpponentGeneration/OpponentGeneration";
import BattleInterface from "./Components/BattleInterface/BattleInterface";
import JoinBattle from "./Components/JoinBattle/JoinBattle";
import DevMenu from "./Components/DevMenu/DevMenu";

import { decodeMetadata } from "./schema";
import { moveIdToName } from "./helpers";

const METADATA_PUBKEY = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const GAME_METADATA_PUBKEY = new PublicKey("4iqJsF4JLz8iLuvMxYvHchtG3wqiZdsNEp1EGPphKVXw");
const BATTLE_PUBKEY = new PublicKey("7c3qcZxkby5jNCUx2ghQraLtrpM1aSR3V3vSWcgmorZS");

function App() {
    const [currentView, setCurrentView] = useState(0);
    const [playerDinosol, setPlayerDinosol] = useState(null);
    const [playerDinosolMap, setPlayerDinosolMap] = useState([]);
    const [opponentDinosol, setOpponentDinosol] = useState(null);
    let [battleAccount, setBattleAccount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        createDinosolMap().then(dinoMap => {
            setPlayerDinosolMap(dinoMap);
            setLoading(false);
        });
    }, []);

    return (
        <div id="app-container">
            {
                renderCurrentView(currentView, setCurrentView, playerDinosol, playerDinosolMap, setPlayerDinosol, opponentDinosol, setOpponentDinosol, battleAccount, setBattleAccount, loading)
            }
        </div>
    );
}

function renderCurrentView(currView,
    viewUpdater,
    playerDinosol,
    playerDinosolMap,
    playerDinosolUpdater,
    opponentDinosol,
    opponentDinosolUpdater,
    battleAccount,
    battleAccountUpdater,
    loading) {
    let viewJsx = null;

    switch (currView) {
        case 0: //Home page
            viewJsx = (
                <Home viewupdate={viewUpdater} loading={loading} />
            );
            break;
        case 1: //Battle Setup
            viewJsx = (
                <DinoSelection dinomap={playerDinosolMap}
                    currentdino={playerDinosol}
                    currentupdater={playerDinosolUpdater}
                    viewupdate={viewUpdater}
                    battleaccount={battleAccount}
                    battleupdater={battleAccountUpdater}
                />
            );
            break;
        case 2: //Battle
            viewJsx = (
                <BattleInterface opponent={opponentDinosol}
                    player={playerDinosol}
                    viewupdate={viewUpdater}
                    dinomap={playerDinosolMap}
                    battleaccount={battleAccount}
                />
            );
            break;
        case 3: //Leaderboards
            viewJsx = (
                <Leaderboard viewupdate={viewUpdater} />
            );
            break;
        case 4: //View Dinosols
            viewJsx = (
                <DinoPen viewupdate={viewUpdater} dinomap={playerDinosolMap} />
            );
            break;
        case 5: //Select Opponent
            viewJsx = (
                <OpponentGeneration playerdino={playerDinosol}
                    opponentdino={opponentDinosol}
                    opponentupdater={opponentDinosolUpdater}
                    viewupdate={viewUpdater}
                    dinomap={playerDinosolMap}
                    battleaccount={battleAccount}
                    battleupdater={battleAccountUpdater}
                />
            );
            break;
        case 6: //Buy Dinosols
            break;
        case 7: //Join Existing Battle
            viewJsx = (
                <JoinBattle viewupdate={viewUpdater}
                    battleaccount={battleAccount}
                    battleupdater={battleAccountUpdater}
                />
            );
            break;
        case 8: //Join Existing Battle
            viewJsx = (
                <DevMenu viewupdate={viewUpdater}
                    battleaccount={battleAccount}
                    battleupdater={battleAccountUpdater}
                    playerdino={playerDinosol}
                    dinomap={playerDinosolMap}
                />
            );
            break;
        default:
            break;
    }

    return viewJsx;
}

async function getNFTs() {
    let connection = new Connection("https://api.devnet.solana.com");
    // Get all token accounts for this wallet
    const accounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(window.solana.publicKey.toString()), { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") });

    // Grab the NFTs (supply is 1 and decimals is 0)
    let tokens = [];
    accounts.value.forEach(account => {
        if (account.account.data.parsed.info.tokenAmount.uiAmount === 1 && account.account.data.parsed.info.tokenAmount.decimals === 0) {
            tokens.push(account.account.data.parsed.info.mint);
        }
    });

    let metadatas = [];
    for (const token of tokens) {
        // Get the metadata PDA.
        let [metadataAccount, bump] = await PublicKey.findProgramAddress([
            Buffer.from("metadata"),
            METADATA_PUBKEY.toBuffer(),
            new PublicKey(token).toBuffer(),
        ], METADATA_PUBKEY);

        // Use the Metaplex node module to grab the metadata.
        try {
            let metadata = await programs.metadata.Metadata.load(connection, metadataAccount)
            // TODO: This is a terrible criteria to filter on. Replace with something better. We might just want to check that a Game Metadata exists?
            // Check that it's a valid Dinosol for battling.
            if (metadata.data.updateAuthority === '3HxqsUguP6E7CNqjvpEAnJ8v86qbyJgWvN2idAKygLdD' && metadata.data.data.name.includes('Test Dinosol')) {
                metadatas.push({ "token": token, "metadata": metadata });
            }
        } catch (e) {
            console.log(e);
        }
    }

    return metadatas;
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

async function createDinosolMap() {
    let dinoMap = {};
    while (!window.solana);
    let result = await window.solana.connect();

    // Grab a list of the compatible NFTs from the player's wallet.
    let accounts = await getNFTs();
    for (let account of accounts) {
        // Grab the game metadata from the NFT.
        let gamemeta = await getGameMetadata(account.token);

        // Grab the NFT metadata so we can use the image.
        let metadataData = await fetch(account.metadata.data.data.uri);
        let data = await metadataData.json();

        // Populate the player's dino map.
        dinoMap[account.token] = {
            dinosolBattleRecord: [],
            nextLevelExp: 0,
            prevExpThreshold: 0,
            dinosolExperience: gamemeta.experience,
            dinosolHP: gamemeta.currStats.health,
            dinosolMaxHP: gamemeta.levelStats.health,
            dinosolId: account.token,
            dinosolImage: data.image,
            dinosolLevel: gamemeta.level,
            dinosolName: account.metadata.data.data.name,
            dinosolAttributes: data.attributes,
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
        console.log(dinoMap);
    }

    return dinoMap;
}


export default App;