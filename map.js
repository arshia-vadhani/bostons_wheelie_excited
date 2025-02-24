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
let trips = [];
let circles;

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);
    const { x, y } = map.project(point);
    return { cx: x, cy: y };
}

function updatePositions() {
    circles
        .attr('cx', d => getCoords(d).cx)
        .attr('cy', d => getCoords(d).cy)
        .attr('r', function() { return d3.select(this).attr('r'); }); // Maintain the size
}

function countTripsPerStation(trips) {
    const counts = {};
    trips.forEach(trip => {
        counts[trip.start_station_id] = (counts[trip.start_station_id] || 0) + 1;
        counts[trip.end_station_id] = (counts[trip.end_station_id] || 0) + 1;
    });
    return counts;
}

function updateCircleSizes(stationCounts) {
    const maxCount = Math.max(...Object.values(stationCounts));
    const sizeScale = d3.scaleSqrt().domain([0, maxCount]).range([3, 20]);

    circles
        .attr('r', d => sizeScale(stationCounts[d.station_id] || 0))
        .append('title')
        .text(d => `Station: ${d.name}\nTrips: ${stationCounts[d.station_id] || 0}`);
}

map.on('load', async () => {
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

    try {
        const [stationData, tripData] = await Promise.all([
            d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json'),
            d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv')
        ]);

        console.log('Loaded Station Data:', stationData);
        console.log('Loaded Trip Data:', tripData);

        stations = stationData.data.stations;
        trips = tripData;

        const svg = d3.select('#map').select('svg');

        circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8);

        const stationCounts = countTripsPerStation(trips);
        updateCircleSizes(stationCounts);
        updatePositions();
    } catch (error) {
        console.error('Error loading data:', error);
    }
});

// Reposition markers on map interactions
map.on('move', updatePositions);
map.on('zoom', updatePositions);
map.on('resize', updatePositions);
map.on('moveend', updatePositions);
