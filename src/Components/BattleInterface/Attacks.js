import React from "react";

function Attacks(props) {
  if (props.disabled) {
    return (
      <div className="attack-container">
        <div>
          <span
            className="move-pointer-disabled"
          >
            {props.details.attackName}
          </span>
        </div>
      </div>
    ); 
  }
  else {
    return (
      <div className="attack-container" onClick={() => props.handleAttackClick(props.details.attackName, props.details.attackDamage, props.setAttacking)}>
        <div>
          <span
            className="move-pointer"
          >
            {props.details.attackName}
          </span>
        </div>
      </div>
    );
  }
}

export default Attacks;
