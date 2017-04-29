import React from 'react';
import NeighbourhoodData from '../assets/sfmaps/neighborhoods.json';
import * as d3 from 'd3';
import MapData from '../Utils/MapData';

export default class Main extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
        let width = '800';
        let height = '800';
        let projection = this.initProjection(height, width);
        let svg = this.drawMap(projection, height, width);

        let vehicleMap = new Map();

        let initialTime = (new Date((new Date).getTime() - 30 * 60000)).getTime();

        let lastTryTime = this.getAllVehicles(vehicleMap, initialTime, svg, projection);

        setInterval(() => {
            lastTryTime = this.getAllVehicles(vehicleMap, lastTryTime, svg, projection);
        }, 30000);
    }

    getAllVehicles(vehicleMap, lastTryTime, svg, projection) {
        MapData.fetchRoutList()
            .then(MapData.parseRouteList)
            .then((routeList) => {
                routeList.forEach((route) => {
                    MapData.fetchVehicles(route.tag, lastTryTime)
                        .then(MapData.parseVehicles)
                        .then((JSONVehicles) => {
                            for (let vehicle of JSONVehicles) {
                                vehicleMap.set(vehicle.id, [
                                    parseFloat(vehicle.lon),
                                    parseFloat(vehicle.lat)
                                ]);
                            }
                            console.log("total muni:" + vehicleMap.size);
                            return Array.from(vehicleMap.values());
                        })
                        .then((vehicleLocations) => this.drawVehicles(svg, vehicleLocations, projection, 'blue'));
                })
            });

        return (new Date()).getTime();
    }

    initProjection(height, width) {
        var projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0]);
        var path = d3.geoPath()
            .projection(projection);

        var bounds = path.bounds(NeighbourhoodData);

        var latitude = {
            min: bounds[1][1],
            max: bounds[0][1]
        };

        var longitude = {
            min: bounds[1][0],
            max: bounds[0][0]
        };

        var horizontalScale = width / (longitude.min - longitude.max);
        var verticalScale = height / (latitude.min - latitude.max);
        var paddingFactor = 0.95; // To avoid touching the border of container.

        // Find out in which dir map will fit without stretching or overflowing the container.
        var scaleFactor = paddingFactor * Math.min(horizontalScale, verticalScale);

        var midLatitude = (latitude.min + latitude.max) / 2;
        var midLongitude = (longitude.min + longitude.max) / 2;

        // move center to the midLatitude and midLongitude of the map
        var translate = [(width / 2 - scaleFactor * midLongitude), (height / 2 - scaleFactor * midLatitude)];

        projection
            .scale(scaleFactor)
            .translate(translate);
        return projection;
    }

    drawMap(projection, height, width) {

        var svg = d3.select('#map')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('stroke', 'green')
            .attr('fill', 'white');

        var path = d3.geoPath()
            .projection(projection);

        svg.selectAll('path')
            .data(NeighbourhoodData.features)
            .enter()
            .append('path')
            .attr('d', path);

        return svg;
    }

    drawStops(svg, locations, projection, color) {
        svg.selectAll("circle")
            .data(locations).enter()
            .append("circle")
            .attr("cx", d =>  projection(d)[0])
            .attr("cy", d =>  projection(d)[1])
            .attr("r", "3px")
            .attr("fill", color)
    }

    drawVehicles(svg, locations, projection, color) {

        let vehicles = svg.selectAll("rect")
            .data(locations);

        vehicles
            .transition()
            .duration(15000)
            .ease(d3.easeLinear)
            .attr("x", d =>  projection(d)[0])
            .attr("y", d =>  projection(d)[1]);

        vehicles.enter()
            .append("rect")
            .attr("x", d =>  projection(d)[0])
            .attr("y", d =>  projection(d)[1])
            .attr('width', 3)
            .attr('height', 3)
            .attr("fill", color);

        vehicles.exit().remove();
    }

    render() {
        return (
            <div id="map">
            </div>
        )
    }
}