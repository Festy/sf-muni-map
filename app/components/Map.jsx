import React from 'react';
import NeighbourhoodData from '../assets/sfmaps/neighborhoods.json';
import * as d3 from 'd3';
import MapData from '../Utils/MapData';

export default class Main extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
        MapData.fetchRoutList()
            .then((xmlRoutes) => MapData.parseRouteList(xmlRoutes))
            .then((routes) => MapData.fetchStops(routes[0].tag))
            .then((xmlStops) => MapData.parseStops(xmlStops))
            .then((stopsJSON) => stopsJSON.map((json) => [parseFloat(json.lon), parseFloat(json.lat)]))
            .then((locations) => this.getMap(locations));
    }

    getMap(locations) {

        var width = '500';
        var height = '500';

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

        svg.selectAll("circle")
            .data(locations).enter()
            .append("circle")
            .attr("cx", d =>  projection(d)[0])
            .attr("cy", d =>  projection(d)[1])
            .attr("r", "3px")
            .attr("fill", "red")
    }

    render() {
        return (
            <div id="map">
            </div>
        )
    }
}