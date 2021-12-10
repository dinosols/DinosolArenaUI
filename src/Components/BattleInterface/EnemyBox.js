import React, { Component } from "react";
import DinosolAvatar from "../Dinosol/DinosolAvatar";
import EnemyAvatar from "../Dinosol/EnemyAvatar";

export class EnemyBox extends Component {
  render() {
    // calc enemy progress bar percentage based on HP
    let percentage = (this.props.enemyHP / this.props.enemyMaxHP) * 100 + "%";
    let num = (this.props.enemyHP / this.props.enemyMaxHP) * 100;
    let progressColor;

    // use enemy progress bar calc to style colors
    if (num <= 25) {
      progressColor = "progress-bar bg-danger";
    } else if (num <= 50) {
      progressColor = "progress-bar bg-warning";
    } else if (num > 50) {
      progressColor = "progress-bar bg-success";
    }
    return (
      <div>
        {/* ENEMY POKEMON CONTAINER */}
        <div id="enemy-container">
          {/* ENEMY POKEMON INFO BOX */}
          <div id="enemy-info-box">
            <div className="d-flex justify-content-between align-items-center">
              <h2 id="enemy-name">{this.props.enemyName}</h2>
              <h5 className="mr-1 d-none d-sm-block">
                Lv
                {this.props.enemyLevel}
              </h5>
            </div>
            <div className="d-flex justify-content-between align-items-center ml-3 mr-1">
              <h5>HP</h5>
              <div className="progress ml-1 both-progress">
                <div
                  className={progressColor}
                  role="progressbar"
                  style={{ width: percentage }}
                  aria-valuenow="75"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
            <div id="enemy-hp" className="d-flex justify-content-between">
              <div className="ml-3 mr-3 float-left">
                <h5>
                  Rank #{this.props.enemyRank}
                </h5>
              </div>
              <div className="ml-3 mr-3 float-right">
                <h5>
                  {Math.floor(this.props.enemyHP)}/{Math.floor(this.props.enemyMaxHP)}
                </h5>
              </div>
            </div>
          </div>
          {/* END ENEMY POKEMON INFO BOX */}

          {/* ENEMY POKEMON AVATAR PICTURE */}
          <div className="mr-sm-4 avatar-box">
            <DinosolAvatar faint={this.props.enemyFaint} dinoside="opponent" dinoimage={this.props.dinoimage}  />
            <div className="oval" />
          </div>
          {/* END ENEMY POKEMON AVATAR PICTURE */}
        </div>
        {/* END ENEMY POKEMON CONTAINER */}
      </div>
    );
  }
}

export default EnemyBox;
