import React from 'react';
import Map from './Map.jsx'
export default class Main extends React.Component {

    constructor () {
        super();
    }

    render() {
        return (
            <div id = "main">
                <Map />
            </div>
        )
    }
}