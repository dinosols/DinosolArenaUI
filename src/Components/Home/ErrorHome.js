import React from 'react';

function ErrorPage(props) {

    return (
        <div className="error-container">
            <h1 className="error-title">Dinosol Kingdom</h1>
            <h1 className="error-exclamation">Uh Oh!</h1>
            <h3>{props.message}</h3>
        </div>
    );
}

export default ErrorPage;