import React from 'react';
import ExpBar from './ExpBar';

function DinoFeature(props) {

    return (
        <div className="dino-feature-container">
            <div className="img-history-flex">
                <h3>{props.dino.dinosolName}</h3>
                <img className="dino-feature-image" src={props.dino.dinosolImage} alt="" />
            </div>
            {/* <ExpBar level={props.dino.dinosolLevel} prevexp={props.dino.prevExpThreshold} currexp={props.dino.dinosolExperience} nextexp={props.dino.nextLevelExp} /> */}
            {/* <div>
                <p><span>Special Attributes</span></p>
                <p>Cigar: +15% Fire Damage</p>
                <p>Bling: -5% Opponent Accuracy</p>
                <p>Tattoo: +10% Base Attack</p>

            </div> */}
        </div>
    );
}

export default DinoFeature;

//<p>{props.dino.level}</p>
//<p>{props.dino.dinoId}</p>
