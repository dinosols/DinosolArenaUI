import React, { useState } from 'react';
import DinoRadio from '../Dinosol/DinoRadio';
import DinoNotSelected from '../../Resources/img/dino-not-selected.jpg';
import { PublicKey, Connection } from '@solana/web3.js';

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


function DinoSelection(props) {

    function renderDinoList() {
        let dinoRadioJsx = [];
        Object.keys(props.dinomap).forEach(dinoId => {

            if (props.dinomap[dinoId].battleAuth.toString() === PublicKey.default.toString()) {
                dinoRadioJsx.push(
                    <DinoRadio dinoid={props.dinomap[dinoId].dinosolId}
                        dinolabel={props.dinomap[dinoId].dinosolName}
                        dinoimage={props.dinomap[dinoId].dinosolImage}
                        groupname="dinosolRadio"
                        updatefunction={handleDinoUpdate}
                        dinoval={props.dinomap[dinoId].dinosolId} />
                );
            }
            else {
                let connection = new Connection("https://api.devnet.solana.com");
                connection.getAccountInfo(new PublicKey(props.dinomap[dinoId].battleAuth)).then((battleAccountInfo) => {
                    const battle = decodeBattle(battleAccountInfo.data);
                    let unixTimestamp = Math.floor(new Date(battle.date).getTime());
                    if (((Date.now() - unixTimestamp) / 1000) / 60 > 30) {
                        console.log("Dino passes timeout.");
                        dinoRadioJsx.push(
                            <DinoRadio dinoid={props.dinomap[dinoId].dinosolId}
                                dinolabel={props.dinomap[dinoId].dinosolName}
                                dinoimage={props.dinomap[dinoId].dinosolImage}
                                groupname="dinosolRadio"
                                updatefunction={handleDinoUpdate}
                                dinoval={props.dinomap[dinoId].dinosolId} />
                        );
                    }
                });
            }
        });

        return dinoRadioJsx;
    }

    function handleDinoUpdate(dinoId) {
        if (props.battleaccount) {
            console.log("handleDinoUpdate: " + props.battleaccount.toString());
        }
        //props.currentupdater(props.dinomap[dinoId]);
        console.log(dinoId);
        props.currentupdater(dinoId);
    }

    function proceedToOpponentGeneration() {
        if (props.currentdino !== null) {
            props.viewupdate(5);
        } else {
            console.log("No Dino Selected!");
        }
    }

    function renderSelectedDinosolImage() {
        console.log(props.currentdino);
        const imgToDisplay = (props.currentdino !== null) ? props.dinomap[props.currentdino].dinosolImage : DinoNotSelected;
        const backgroundStyle = {
            backgroundImage: `url(${imgToDisplay})`
        };

        return backgroundStyle;
    }



    return (
        <div className="dino-selection">
            <div id="selected-dino-display" style={renderSelectedDinosolImage()} >

            </div>
            <div id="dino-selection-panel" className='section-container'>
                <input className="back-button" type="button" value="Back" onClick={props.viewupdate.bind(null, 0)} />
                <h1 className="selection-header">Choose Your Dinosol!</h1>
                <div className="dino-flex">
                    {renderDinoList()}
                </div>
                <div className="selection-button-container">
                    <input type="button" className="continue-button" value="Continue >" onClick={proceedToOpponentGeneration} />
                </div>
            </div>
        </div>
    );
}




export default DinoSelection;