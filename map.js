mapboxgl.accessToken = 'pk.eyJ1IjoiYXJzaGlhLXZhZGhhbmkiLCJhIjoiY203ZG95OG83MDVnaTJrb2dra2wxbGsyNyJ9.zgaAULXAjZUH5wfI8RVnPg';

const map = new mapboxgl.Map({
    container: 'map', 
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027], 
    zoom: 12, 
    minZoom: 5, 
    maxZoom: 18 
});

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
            'line-width': 3,          // Thicker lines
            'line-opacity': 0.6       // Slightly less transparent
          }// Reference the shared style object
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
            'line-width': 3,          // Thicker lines
            'line-opacity': 0.6       // Slightly less transparent
          } // Reuse the same styling
    });
    const jsonUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

    // Fetch the JSON file
    d3.json(jsonUrl).then(jsonData => {
        console.log('Loaded JSON Data:', jsonData);  // Verify the structure

        const stations = jsonData.data.stations; // Extract station array
        console.log('Stations Array:', stations); // Verify extracted data
    }).catch(error => {
        console.error('Error loading JSON:', error);  // Handle errors
    });
});
