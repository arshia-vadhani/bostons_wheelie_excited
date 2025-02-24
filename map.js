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

map.on('load', async () => {
    try {
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

        // Fetch station and trip data
        const [stationData, tripData] = await Promise.all([
            d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json'),
            d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv')
        ]);

        stations = stationData.data.stations;
        trips = tripData;

        const departures = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.start_station_id
        );

        const arrivals = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.end_station_id
        );

        stations = stations.map((station) => {
            let id = station.short_name;
            station.arrivals = arrivals.get(id) ?? 0;
            station.departures = departures.get(id) ?? 0;
            station.totalTraffic = station.arrivals + station.departures;
            return station;
        });

        const radiusScale = d3
            .scaleSqrt()
            .domain([0, d3.max(stations, (d) => d.totalTraffic)])
            .range([0, 25]);

        const svg = d3.select('#map').select('svg');

        circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.6)
            .attr('r', d => radiusScale(d.totalTraffic))
            .each(function(d) {
                // Add <title> for browser tooltips
                d3.select(this)
                    .append('title')
                    .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
            });

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

