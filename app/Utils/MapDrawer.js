import * as d3 from 'd3';
import * as tip from "d3-tip";
d3.tip = tip;

export default class MapDrawer {

    constructor(svgHeight, svgWidth, mapData) {
        this.svgHeight = svgHeight;
        this.svgWidth = svgWidth;
        this.mapData = mapData;
        this.projection = null;
        this.tooltips = null;
        this.lightColors = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#B39DDB', '#9FA8DA', '#90CAF9', '#B2EBF2', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFECB3', '#FFECB3', '#D7CCC8', '#FFCCBC', '#CFD8DC'];
    }

    _initProjection(map) {
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

        var horizontalScale = this.svgWidth / (longitude.min - longitude.max);
        var verticalScale = this.svgHeight / (latitude.min - latitude.max);
        var paddingFactor = 0.95; // To avoid touching the border of container.

        // Find out in which dir map will fit without stretching or overflowing the container.
        var scaleFactor = paddingFactor * Math.min(horizontalScale, verticalScale);

        var midLatitude = (latitude.min + latitude.max) / 2;
        var midLongitude = (longitude.min + longitude.max) / 2;

        // move center to the midLatitude and midLongitude of the map
        var translate = [(this.svgWidth / 2 - scaleFactor * midLongitude), (this.svgHeight / 2 - scaleFactor * midLatitude)];

        this.projection
            .scale(scaleFactor)
            .translate(translate);
    }

    _initSVG(svgId) {
        this.svg = d3.select(svgId)
            .append('svg')
            .attr('width', this.svgWidth)
            .attr('height', this.svgHeight)
            .attr('fill', 'white')
            .attr('id', 'svg');
    }

    saveMap () {
        var svgData = document.getElementById('svg').outerHTML;
        var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "sf_map.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    
    drawMap (map, options, svgId) {

        if (!this.svg) this._initSVG(svgId);
        if (!this.projection) this._initProjection(map);
        if (!this.tooltips) this._initTooltips();

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
            });
    }

    _initTooltips() {

        this.tooltips = new Map();

        this._createTooltip({
            name: 'routeTip',
            class: 'd3-tip',
            offset: [-10, 0],
            htmlFunction: (d) => `<strong>Route Name:</strong> <span>${d.title}</span>`
        });

        this._createTooltip({
            name: 'stopTip',
            class: 'd3-tip',
            offset: [-10, 0],
            htmlFunction: (d) => `<strong>Stop Name:</strong> <span>${d.title}</span>`
        });

        this._createTooltip({
            name: 'vehicleTip',
            class: 'd3-tip',
            offset: [-10, 0],
            htmlFunction: (d) => `<strong>Vehicle ID:</strong> <span>${d.id}</span> <br /> <strong>Route:</strong> <span>${d.routeTitle}</span>`
        });
    }

    _createTooltip(options) {

        let tip = d3.tip()
            .attr('class', options.class)
            .offset(options.offset)
            .html(options.htmlFunction);

        this.svg.call(tip);

        this.tooltips.set(options.name, tip);
    }

    toggleRouteVisibility(visibleRoutesList, totalRoutes) {
        for (let route of totalRoutes) {
            let group = this.svg.selectAll('#route'+route);

            if (visibleRoutesList.indexOf(route) === -1) group.attr('visibility', 'hidden');
            else group.attr('visibility', 'visible');
        }
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

        let routeTip = this.tooltips.get('routeTip');

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
                if (routeTip) routeTip.show(d);
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr('stroke-width', 1);
                if (routeTip) routeTip.hide(d);
            })
    }

    drawStopsForRoute(route) {
        let stopTip = this.tooltips.get('stopTip');
        this.svg
            .data(route.stop)
            .append("circle")
            .attr("cx", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[0])
            .attr("cy", d => this.projection([parseFloat(d.lon), parseFloat(d.lat)])[1])
            .attr("r", "4px")
            .attr('fill', 'black')
            .on('mouseover', function () {
                d3.select(this)
                    .attr("r", "7px");
                if (stopTip) stopTip.show(route);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .attr("r", "4px");
                if (stopTip) stopTip.hide(route);
            })

    }

    drawAllVehicles(vehicleMap, routeMap) {

        let vehicleList = Array.from(vehicleMap.values());
        let vehicleTip = this.tooltips.get('vehicleTip');

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
                    .attr('height', 10);
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
                    .attr('height', 6);

                vehicleTip.hide();
                d3.select('path#route' + d.routeTag)
                    .attr('stroke-width', 1);
            });

        vehicles.exit().remove();
    }


}