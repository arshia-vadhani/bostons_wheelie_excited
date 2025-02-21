mapboxgl.accessToken = 'pk.eyJ1IjoiYXJzaGlhLXZhZGhhbmkiLCJhIjoiY203ZG95OG83MDVnaTJrb2dra2wxbGsyNyJ9.zgaAULXAjZUH5wfI8RVnPg';


const map = new mapboxgl.Map({
    container: 'map', 
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027], 
    zoom: 12, 
    minZoom: 5, 
    maxZoom: 18 
});

const svg = d3.select('#map').select('svg');
let stations = [];
let circles;

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
    const { x, y } = map.project(point);  // Project to pixel coordinates
    return { cx: x, cy: y };  // Return as object for use in SVG attributes
}
function updatePositions() {
    circles
      .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
      .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
}

map.on('load', () => {


    // Add Boston bike lanes
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
    });

    map.addLayer({
        id: 'boston-bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': '#32D400',  // A bright green using hex code
            'line-width': 5,          // Thicker lines
            'line-opacity': 0.6       // Slightly less transparent
          } // Reference the shared style object
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
            'line-color': '#32D400',  // A bright green using hex code
            'line-width': 5,          // Thicker lines
            'line-opacity': 0.6       // Slightly less transparent
          } // Reuse the same styling
    });

    const jsonUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

    // Fetch the JSON file
    d3.json(jsonUrl).then(jsonData => {
        console.log('Loaded JSON Data:', jsonData);  // Verify the structure
        stations = jsonData.data.stations; // Access the station data
        console.log('Stations Array:', stations); // Verify extracted data

        // Append circles to the SVG for each station
        const circles = svg.selectAll('circle')
          .data(stations)
          .enter()
          .append('circle')
          .attr('r', 5)               // Radius of the circle
          .attr('fill', 'steelblue')  // Circle fill color
          .attr('stroke', 'white')    // Circle border color
          .attr('stroke-width', 1)    // Circle border thickness
          .attr('opacity', 0.8);      // Circle opacity

        // Initial position update when map loads
        updatePositions();
    }).catch(error => {
        console.error('Error loading JSON:', error); // Handle errors
    });
});

// Function to update circle positions when the map moves/zooms

// Reposition markers on map interactions
map.on('move', updatePositions);     // Update during map movement
map.on('zoom', updatePositions);     // Update during zooming
map.on('resize', updatePositions);   // Update on window resize
map.on('moveend', updatePositions);  // Final adjustment after movement ends
