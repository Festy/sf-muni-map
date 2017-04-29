const AGENCY = "sf-muni";
const URL = "http://webservices.nextbus.com/service/publicXMLFeed?a="+ AGENCY;

var mapData = {

    fetchRoutList: () => {
        return fetch(URL + '&command=routeList')
            .then((val) => val.text());
    },

    parseRouteList: (xmlRouteList) => {
        let routesList = [];
        let domParser = new DOMParser();
        let xmlDom = domParser.parseFromString(xmlRouteList, "text/xml");
        let routes = xmlDom.getElementsByTagName('route');

        for (let route of routes) {
            routesList.push({
                tag : route.getAttribute('tag'),
                title: route.getAttribute('title')
            })
        }
        return routesList;
    },

    fetchStops: (routeTag) => {
        return fetch(URL + '&command=routeConfig'+'&r='+routeTag)
            .then((val) => val.text())
    },

    fetchAllStops: (callback) => {
        mapData.fetchRoutList()
            .then((XMLRoutes) => mapData.parseRouteList(XMLRoutes))
            .then((routes) => {
                for (let route of routes) {
                    if (route.tag) mapData.fetchStops(route.tag)
                        .then((XMLStops) => mapData.parseStops(XMLStops))
                        .then((JSONstops) => JSONstops.map((json) => [parseFloat(json.lon), parseFloat(json.lat)]))
                        .then((locations) => callback(locations));
                }
            })
    },

    fetchVehicles: (routeTag, lastTryTime) => {
        return fetch(URL + '&command=vehicleLocations'+'&r='+routeTag+'&t='+lastTryTime)
            .then((val) => val.text())
    },

    parseVehicles: (xmlVehicleList) => {
        let vehicleList = [];
        let domParser = new DOMParser();
        let xmlDom = domParser.parseFromString(xmlVehicleList, "text/xml");
        let vehicles = xmlDom.querySelectorAll('vehicle');

        for (let vehicle of vehicles) {
            if (vehicle.getAttribute('lat') !== undefined && vehicle.getAttribute('lat') !== null) {
                vehicleList.push({
                    id: vehicle.getAttribute('id'),
                    lat: vehicle.getAttribute('lat'),
                    lon: vehicle.getAttribute('lon')
                });
            }
        }
        return vehicleList;
    },

    parseStops: (xmlStopsList) => {
        let stopsList = [];
        let domParser = new DOMParser();
        let xmlDom = domParser.parseFromString(xmlStopsList, "text/xml");
        let stops = xmlDom.querySelectorAll('body route stop');

        for (let stop of stops) {
            if (stop.getAttribute('lat') !== undefined && stop.getAttribute('lat') !== null) {
                stopsList.push({
                    tag: stop.getAttribute('tag'),
                    title: stop.getAttribute('title'),
                    lat: stop.getAttribute('lat'),
                    lon: stop.getAttribute('lon'),
                    stopId: stop.getAttribute('stopId')
                })
            }
        }
        return stopsList;
    }

};

export default mapData;