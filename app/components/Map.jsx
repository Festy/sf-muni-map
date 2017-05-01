import React from 'react';
import NeighbourhoodData from '../assets/sfmaps/neighborhoods.json';
import streets from '../assets/sfmaps/streets.json';
import * as d3 from 'd3';
d3.tip = require("d3-tip");
import MapData from '../utils/MapData';
import RouteSelector from './RouteSelector.jsx';

export default class Main extends React.Component {

    constructor() {
        super();
        this.canvasHeight = '1000';
        this.canvasWidth = '1000';
        this.lightColors = [
            '#FFCDD2',
            '#F8BBD0',
            '#E1BEE7',
            '#B39DDB',
            '#9FA8DA',
            '#90CAF9',
            '#B2EBF2',
            '#C8E6C9',
            '#DCEDC8',
            '#F0F4C3',
            '#FFECB3',
            '#FFECB3',
            '#D7CCC8',
            '#FFCCBC',
            '#CFD8DC'
        ];

        this.routeMap = new Map();
        this.vehicleMap = new Map();
        this.initProjection(NeighbourhoodData);
        this.lastAttemptTime = null;

        this.state = {
            visibleRoutes: "",
            routes: []
        };
    }

    componentDidMount() {
        this.initSVG();
        this.drawMap(NeighbourhoodData, {strokeWidth: 1, stroke: 'brown', fill: 'random'});
        this.initRouteTip();
        this.initStopTip();
        this.initVehicleTip();
        this.getRoutes();
        this.getAllVehicles();
        this.drawMap(streets, {strokeWidth: 1, stroke: 'darkgrey'});
    }

    handleChange(visibleRoutes) {

        let visibleRoutesList = visibleRoutes.split(',');

        for (let route of this.state.routes) {
            let group = this.svg.selectAll('#route'+route.label);

            if (visibleRoutesList.indexOf(route.label) === -1) group.attr('visibility', 'hidden');
            else group.attr('visibility', 'visible');
        }

        this.setState({
            visibleRoutes : visibleRoutes
        });
    }

    getRoutes() {
        MapData.fetchAllRoutes()
            .then((data) => {
                if (data.route) {
                    let routeNames = []
                    for (let routeItem of data.route) {
                        let existingData = this.routeMap.get() || {};
                        this.routeMap.set(routeItem.tag, {
                            ...existingData,
                            tag: routeItem.tag,
                            title: routeItem.title
                        });

                        this.getRouteConfig(routeItem.tag);
                        routeNames.push(routeItem.tag);

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
                    this.drawRoute(data.route);
                    this.drawStopsForRoute(data.route);
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
                this.drawAllVehicles();
            });
        setTimeout(this.getAllVehicles.bind(this), 15000);
    }

    initProjection(map) {
        this.projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0]);

        var path = d3.geoPath()
            .projection(this.projection);

        var bounds = path.bounds(map);

        var latitude = {
            min: bounds[1][1],
            max: bounds[0][1]
        };

        var longitude = {
            min: bounds[1][0],
            max: bounds[0][0]
        };

        var horizontalScale = this.canvasWidth / (longitude.min - longitude.max);
        var verticalScale = this.canvasHeight / (latitude.min - latitude.max);
        var paddingFactor = 0.95; // To avoid touching the border of container.

        // Find out in which dir map will fit without stretching or overflowing the container.
        var scaleFactor = paddingFactor * Math.min(horizontalScale, verticalScale);

        var midLatitude = (latitude.min + latitude.max) / 2;
        var midLongitude = (longitude.min + longitude.max) / 2;

        // move center to the midLatitude and midLongitude of the map
        var translate = [(this.canvasWidth / 2 - scaleFactor * midLongitude), (this.canvasHeight / 2 - scaleFactor * midLatitude)];

        this.projection
            .scale(scaleFactor)
            .translate(translate);
    }

    initSVG() {
        this.svg = d3.select('#map')
            .append('svg')
            .attr('width', this.canvasWidth)
            .attr('height', this.canvasHeight)
            .attr('fill', 'white');
    }

    initRouteTip() {
        this.routeTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d) {
                return `<strong>Route Name:</strong> <span>${d.title}</span>`;
            });

        this.svg.call(this.routeTip);
    }

    initStopTip() {
        this.stopTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d) {
                return `<strong>Stop Name:</strong> <span>${d.title}</span>`;
            });

        this.svg.call(this.stopTip);
    }

    initVehicleTip() {
        this.vehicleTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d) {
                return `<strong>Vehicle ID:</strong> <span>${d.id}</span> <br /> <strong>Route:</strong> <span>${d.routeTitle}</span>`;
            });

        this.svg.call(this.vehicleTip);
    }

    drawMap(map, options) {

        var path = d3.geoPath()
            .projection(this.projection);

        this.svg.selectAll('path')
            .data(map.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('stroke', options.stroke)
            .attr('stroke-width', options.strokeWidth)
            .attr('fill', () => {
                let fill;
                if (!options.fill) fill = 'none';
                else if (options.fill === 'random') fill = this.lightColors[Math.floor(15 * Math.random())];
                else fill = options.fill;
                return fill;
            })
    }

    drawRoute(route) {
        let path = route.path[0].point;
        let routeColor = "#" + route.color;
        if (route.color === '000000') routeColor = 'red';

        let line = d3.line()
            .x(d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[0])
            .y(d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[1])
            .curve(d3.curveLinear);

        function combinedPath(paths) {
            let finalPath = "";
            for (let path of paths) {
                finalPath += line(path.point);
            }

            return finalPath;
        }

        let routeTip = this.routeTip;

        this.svg
            .datum(route)
            .append('path')
            .attr('d', (d) => combinedPath(d.path))
            .attr('stroke', routeColor)
            .attr("fill", "none")
            .attr('stroke-width', 1)
            .attr('title', (d) => d.title)
            .attr('id', (d) => 'route' + d.tag)
            .attr('routegroup', (d) => 'route' + d.tag)
            .on('mouseover', function (d) {
                d3.select(this)
                    .attr('stroke-width', 5);
                routeTip.show(d);
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr('stroke-width', 1);
                routeTip.hide(d);
            })
    }

    drawStopsForRoute(route) {
        let stopTip = this.stopTip;
        this.svg
            .data(route.stop)
            .append("circle")
            .attr("cx", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[0])
            .attr("cy", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[1])
            .attr("r", "4px")
            .attr('fill', 'black')
            .on('mouseover', function () {
                d3.select(this)
                    .attr("r", "7px")
                stopTip.show(route);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .attr("r", "4px")
                stopTip.hide();
            })

    }

    drawAllVehicles() {

        let vehicleList = Array.from(this.vehicleMap.values());
        let vehicleTip = this.vehicleTip;
        let routeMap = this.routeMap;

        let vehicles = this.svg.selectAll("rect")
            .data(vehicleList);

        vehicles
            .transition()
            .ease(d3.easeLinear)
            .attr("x", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[0])
            .attr("y", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[1])
            .duration(1500);

        vehicles.enter()
            .append("rect")
            .attr("x", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[0])
            .attr("y", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[1])
            .attr('width', 6)
            .attr('height', 6)
            .attr("fill", 'blue')
            .attr('title', d => d.id)
            .attr('id', (d) => 'route' + d.routeTag)
            .on('mouseover', function (d) {
                d3.select(this)
                    .attr('width', 10)
                    .attr('height', 10)
                d3.select('path#route' + d.routeTag)
                    .attr('stroke-width', 5);
                vehicleTip.show({
                    id: d.id,
                    routeTitle: routeMap.get(d.routeTag).title //to avoid 'numerical only' ids
                });
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr('width', 6)
                    .attr('height', 6)
                vehicleTip.hide();
                d3.select('path#route' + d.routeTag)
                    .attr('stroke-width', 1);
            });

        vehicles.exit().remove();
    }

    render() {
        return (
            <div>
                <RouteSelector routes={this.state.routes} visibleRoutes = {this.state.visibleRoutes} handleChange = {this.handleChange.bind(this)}/>
                <div id="map">
                </div>
            </div>

        )
    }

}