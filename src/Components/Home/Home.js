import React from 'react';

function Home(props) {

    if (!props.loading) {
        return (
            <div id="home-container">
                {/* <PhantomConnection/> */}
                <div id="home-text-container">
                    <div id="home-title-container">
                        <h1>Dinosol Kingdom</h1>
                    </div>
                    <ul id="home-menu-options">
                        <li className="main-menu-option" onClick={props.viewupdate.bind(null, 1)} >Start Battle!</li><br />
                        <li className="main-menu-option" onClick={props.viewupdate.bind(null, 7)} >Join Battle!</li><br />
                        <li className="main-menu-option" style={{color:'gray'}}/*onClick={props.viewupdate.bind(null, 3)}*/ >Leaderboards</li><br />
                        <li className="main-menu-option" onClick={props.viewupdate.bind(null, 4)} >View My Dinosols</li><br />
                        <li className="main-menu-option" onClick={props.viewupdate.bind(null, 6)} >Buy Dinosols</li><br />
                        <li className="main-menu-option" onClick={props.viewupdate.bind(null, 8)} >Developer Menu</li><br />
                        <li className="main-menu-option" onClick={handleSignOutFromWallet} >Sign Out From My Wallet</li><br />
                    </ul>
                </div>
            </div>
        );
    } else {
        return null;
    }
}

function handleSignOutFromWallet() {
    window.solana.disconnect();
    console.log("Signed Out");
}

export default Home;