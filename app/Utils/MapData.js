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

        console.log(routesList);
        return routesList;
    },

    fetchStops: (routeTag) => {
        return fetch(URL + '&command=routeConfig'+'&r='+routeTag)
            .then((val) => val.text())
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