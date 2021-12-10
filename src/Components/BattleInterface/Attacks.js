import React from "react";

function Attacks(props) {
  return (
    <div className="attack-container" onClick={async () => props.handleAttackClick(props.details.attackName, props.details.attackDamage)}>
      <div>
        <span
          className="move-pointer"
          >
          { props.details.attackName }
        </span>
      </div>
    </div>
  );
}

export default Attacks;
