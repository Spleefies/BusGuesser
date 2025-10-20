const map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/satellite/style.json?key=KssOLFMavc6dPRPehpwJ',
  center: [103.818108, 1.3431684],
  zoom: 11
});
map.on('load', async () => {
  try {
    const res = await fetch('https://data.busrouter.sg/v1/stops.min.geojson');
    const stopsData = await res.json();

    map.addSource('bus-stops', {
      type: 'geojson',
      data: stopsData
    });

    map.addLayer({
      id: 'bus-stops-layer',
      type: 'circle',
      source: 'bus-stops',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 1,
          12, 4,
          14, 6,
          16, 15
        ],
        'circle-color': '#248623',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      },
      filter: ['==', '$type', 'Point']
    });

    map.on('click', 'bus-stops-layer', (e) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates.slice();
      const props = feature.properties || {};
      
      const html = `
          <strong>${props.name || 'Unknown'}</strong> <br>
          <strong>Stop ID:</strong> ${props.number || 'N/A'}<br>
          <button onclick="console.log(${props.number})">Lock in</button>
        `;
      
      new maplibregl.Popup()
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
    });

    map.on('mouseenter', 'bus-stops-layer', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'bus-stops-layer', () => map.getCanvas().style.cursor = '');
    console.log(stopsData.features.find(f => f.id === "17191"))
  } catch (err) {
    console.error('Error loading stops:', err);
  }
});
const card = document.querySelector(".card")