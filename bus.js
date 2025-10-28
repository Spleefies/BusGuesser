import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/satellite/style.json?key=cRXF0Q8VCbwDnBOhhfNP',
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
  } catch (err) {
    console.error('Error loading stops:', err);
  }
});

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://xowfiaodrlbghhoobmbm.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvd2ZpYW9kcmxiZ2hob29ibWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTI4MDQsImV4cCI6MjA3NjM2ODgwNH0.eOze-pW1rD7TN9-fR7FTA4QMcG3Mcip7RIZmAInQ7z0"
const supabase = createClient(supabaseUrl, supabaseKey)

async function getImgUrl() {
  const { data, error } = await supabase.storage.from('Images').list()
  if (error) {
    console.error(error)
  } else {
    return supabase.storage.from('Images').getPublicUrl(data[Math.floor(Math.random()*data.length)].name).data.publicUrl
  }
}
getImgUrl().then(url => console.log(url))
const mainimg = document.querySelector("#mainimg");
getImgUrl().then(url => {
  mainimg.src = url;
});