import React from 'react';
import NeighbourhoodData from '../assets/sfmaps/neighborhoods.json';
import * as d3 from 'd3';
d3.tip = require("d3-tip");
import MapData from '../utils/MapData';

export default class Main extends React.Component {

    constructor() {
        super();
        this.canvasHeight = '700';
        this.canvasWidth = '700';
        this.routeMap = new Map();
        this.initProjection(NeighbourhoodData);
    }

    componentDidMount() {
        this.initSVG();
        this.drawMap(NeighbourhoodData, 'grey');
        this.initRouteTip();
        this.getRoutes();
    }

    getRoutes() {
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
                }
            })
    }

    getAllVehiclesPosition(initialTime) {
        MapData.fetchAllRoutes()
            .then((routes) => {
                routes.forEach((route) => {
                    this.getVehiclesPosition(route.tag, initialTime);
                })
            });
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
            .html(function(d) {
                return `<strong>Route Name:</strong> <span>${d.title}</span>`;
            });

        this.svg.call(this.routeTip);
    }

    drawMap(map, color) {
        var path = d3.geoPath()
            .projection(this.projection);

        this.svg.selectAll('path')
            .data(map.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('stroke', color);
    }

    drawRoute(route) {
        let path = route.path[0].point;
        let routeColor = "#" + route.color;
        let line = d3.line()
            .x(d =>  this.projection([parseFloat(d.lon), parseFloat(d.lat)])[0])
            .y(d =>  this.projection([parseFloat(d.lon), parseFloat(d.lat)])[1])
            .curve(d3.curveLinear);

        let routeTip = this.routeTip;
        this.svg
            .datum(route)
            .append('path')
            .attr('d', (d) => line(d.path[0].point))
            .attr('stroke', routeColor)
            .attr("fill", "none")
            .attr('stroke-width',2)
            .attr('title', (d) => d.title)
            .on('mouseover',function(d) {
                d3.select(this)
                    .attr('stroke-width',5);
                routeTip.show(d);
            })
            .on('mouseout',function (d) {
                d3.select(this)
                    .attr('stroke-width',2);
                routeTip.hide(d);
            })
    }

    drawStops(locations, color) {
        this.svg.selectAll("circle")
            .data(locations).enter()
            .append("circle")
            .attr("cx", d =>  this.projection(d)[0])
            .attr("cy", d =>  this.projection(d)[1])
            .attr("r", "3px")
            .attr("fill", color)
    }

    drawVehicles(vehiclesData, color) {

        let vehicles = this.svg.selectAll("rect")
            .data(vehiclesData, d => d.lat + ''+ d.lon);

        vehicles
            .attr('width', 10)
            .attr('height', 10)
            .attr("fill", 'red')
            .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr("x", d =>  this.projection([d.lon, d.lat])[0])
                .attr("y", d =>  this.projection([d.lon, d.lat])[1])
            .transition()
                .delay(1500).duration(0)
                .attr("fill", 'blue')
                .attr('width', 6)
                .attr('height', 6);

        vehicles.enter()
            .append("rect")
            .attr("x", d =>  this.projection([d.lon, d.lat])[0])
            .attr("y", d =>  this.projection([d.lon, d.lat])[1])
            .attr('width', 6)
            .attr('height', 6)
            .attr("fill", color)
            .attr('title', d => d.id);

        vehicles.exit().remove();
    }

    render() {
        return (
            <div id="map">
            </div>
        )
    }
}