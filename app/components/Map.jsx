import React from 'react';
import neighbourhoodData from '../assets/sfmaps/neighborhoods.json';
import * as d3 from 'd3';

export default class Main extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
        this.getMap();
    }

    getMap() {

        var width = '500';
        var height = '500';

        var projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0]);

        var path = d3.geoPath()
            .projection(projection);

        var bounds = path.bounds(neighbourhoodData);

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
            .data(neighbourhoodData.features)
            .enter()
            .append('path')
            .attr('d', path);

        let locations = [
            [-122.41732, 37.8071299],
            [-122.41412, 37.8074099],
            [-122.41081, 37.8078399],
            [-122.4060299, 37.8066299],
            [-122.4033099, 37.8050199],
            [-122.40103, 37.80296],
            [-122.3989199, 37.8006099]
        ];

        svg.selectAll("circle")
            .data(locations).enter()
            .append("circle")
            .attr("cx", d => projection(d)[0])
            .attr("cy", d => projection(d)[1])
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