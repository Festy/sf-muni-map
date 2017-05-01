import React from 'react';
import NeighbourhoodData from '../assets/sfmaps/neighborhoods.json';
import * as d3 from 'd3';
d3.tip = require("d3-tip");
import MapData from '../utils/MapData';
import MapDrawer from '../utils/MapDrawer';
import RouteSelector from './RouteSelector.jsx';

export default class Main extends React.Component {

    constructor() {
        super();

        this.routeMap = new Map();
        this.vehicleMap = new Map();

        this.mapDrawer = new MapDrawer('1000', '1000', NeighbourhoodData);
        
        this.lastAttemptTime = null;

        this.state = {
            visibleRoutes: "",
            routes: []
        };
    }

    componentDidMount() {

        this.mapDrawer.drawMap(NeighbourhoodData, {
            strokeWidth: 1,
            stroke: 'brown',
            fill: 'random'
        }, '#svg_container', true);

        this.getAllRoutes();
        this.getAllVehicles();

        setTimeout(() => {
            fetch('./streets.json')
                .then(response => response.text())
                .then((json) => {
                    this.mapDrawer.drawMap(JSON.parse(json), {strokeWidth: 0.4, stroke: 'darkgrey'}, false);
                });
        }, 2000);

    }

    handleChange(visibleRoutes) {

        this.mapDrawer.toggleRouteVisibility(visibleRoutes.split(','), this.state.routes.map((item) => item.label));

        this.setState({
            visibleRoutes : visibleRoutes
        });
    }

    getAllRoutes() {
        MapData.fetchAllRoutes()
            .then((data) => {
                if (data.route) {

                    for (let routeItem of data.route) {

                        let existingData = this.routeMap.get() || {};

                        this.routeMap.set(routeItem.tag, {
                            ...existingData,
                            tag: routeItem.tag,
                            title: routeItem.title
                        });

                        this.getRouteConfig(routeItem.tag);

                        this.setState({
                            routes: this.state.routes.concat([
                                {
                                    value: routeItem.tag,
                                    label: routeItem.tag
                                }
                            ]),
                            visibleRoutes: this.state.visibleRoutes.length ? this.state.visibleRoutes + "," + routeItem.tag : routeItem.tag
                        });
                    }

                }
            });
    }

    getRouteConfig(routeTag) {
        MapData.fetchRouteConfig(routeTag)
            .then((data) => {
                if (data.route) {
                    let existingData = this.routeMap.get(routeTag);

                    this.routeMap.set(routeTag, {
                        ...existingData,
                        ...data.route
                    });

                    this.mapDrawer.drawRoute(data.route);
                    this.mapDrawer.drawStopsForRoute(data.route);
                }
            })
    }

    getAllVehicles() {
        MapData.fetchAllVehicles(this.lastAttemptTime)
            .then((data) => {
                this.lastAttemptTime = data.lastAttemptTime;
                for (let vehicle of data.vehicle) {
                    this.vehicleMap.set(vehicle.id, vehicle);
                }
                this.mapDrawer.drawAllVehicles(this.vehicleMap, this.routeMap);
            });
        setTimeout(this.getAllVehicles.bind(this), 15000);
    }

    render() {
        return (
            <div>
                <div id="app_title">SF Muni Tracker</div>
                <RouteSelector routes={this.state.routes} visibleRoutes = {this.state.visibleRoutes} handleChange = {this.handleChange.bind(this)}/>
                <div id="svg_container">
                </div>
            </div>

        )
    }

}