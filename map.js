mapboxgl.accessToken = 'pk.eyJ1IjoiYXJzaGlhLXZhZGhhbmkiLCJhIjoiY203ZG95OG83MDVnaTJrb2dra2wxbGsyNyJ9.zgaAULXAjZUH5wfI8RVnPg';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});

let stations = [];
let circles;
let trips = [];
let stationTraffic = {};

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);
    const { x, y } = map.project(point);
    return { cx: x, cy: y };
}

function updatePositions() {
    circles
      .attr('cx', d => getCoords(d).cx)
      .attr('cy', d => getCoords(d).cy);
}

map.on('load', () => {
    // Add Boston bike lanes
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
    });

    map.addLayer({
        id: 'boston-bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': '#32D400',
            'line-width': 5,
            'line-opacity': 0.6
        }
    });

    // Add Cambridge bike lanes
    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
    });

    map.addLayer({
        id: 'cambridge-bike-lanes',
        type: 'line',
        source: 'cambridge_route',
        paint: {
            'line-color': '#32D400',
            'line-width': 5,
            'line-opacity': 0.6
        }
    });

    const jsonUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    const trafficUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';

    // Fetch station data
    d3.json(jsonUrl).then(jsonData => {
        stations = jsonData.data.stations;
        console.log('Loaded Stations:', stations);

        const svg = d3.select('#map').select('svg');

        // Append circles to the SVG for each station
        circles = svg.selectAll('circle')
          .data(stations)
          .enter()
          .append('circle')
          .attr('fill', 'steelblue')
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .attr('opacity', 0.8);

        updatePositions(); // Initial positioning

        // Fetch and process traffic data
        fetchTrafficData();
    }).catch(error => {
        console.error('Error loading JSON:', error);
    });
});

// Fetch traffic data and process it
function fetchTrafficData() {
    d3.csv(trafficUrl).then(data => {
        trips = data;
        console.log('Loaded Trips Data:', trips);
        processTrafficData();
    }).catch(error => {
        console.error('Error loading CSV:', error);
    });
}

// Compute the number of trips per station
function processTrafficData() {
    trips.forEach(trip => {
        const stationId = trip.start_station_id;
        stationTraffic[stationId] = (stationTraffic[stationId] || 0) + 1;
    });

    console.log('Station Traffic:', stationTraffic);
    updateCircleSizes();
}

// Update circle sizes based on traffic
function updateCircleSizes() {
    const maxTraffic = Math.max(...Object.values(stationTraffic));

    circles.attr('r', d => {
        const traffic = stationTraffic[d.station_id] || 0;
        return 3 + (traffic / maxTraffic) * 10; // Scale radius (min: 3px, max: 13px)
    });
}

// Reposition markers on map interactions
map.on('move', updatePositions);
map.on('zoom', updatePositions);
map.on('resize', updatePositions);
map.on('moveend', updatePositions);

