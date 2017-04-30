const AGENCY = "sf-muni";
const URL = "http://webservices.nextbus.com/service/publicJSONFeed?a="+ AGENCY;

var mapData = {

    fetchAllRoutes: () => {
        return fetch(URL + '&command=routeList')
            .then((response) => response.text())
            .then((string) => JSON.parse(string));
    },

    fetchVehiclesForRoute: (routeTag, lastTryTime) => {
        let url = URL + '&command=vehicleLocations'+'&r='+routeTag + (lastTryTime ? '&t='+lastTryTime : '');
        return fetch(url)
            .then((response) => response.text())
            .then((string) => JSON.parse(string));
    },

    fetchRouteConfig: (routeTag) => {
        return fetch(URL + '&command=routeConfig'+'&r='+routeTag)
            .then((response) => response.text())
            .then((string) => JSON.parse(string))
    }

};

export default mapData;