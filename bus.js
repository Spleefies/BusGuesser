import maplibregl, { LngLat } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/satellite/style.json?key=cRXF0Q8VCbwDnBOhhfNP',
  center: [103.818108, 1.3431684],
  zoom: 11
})
let stopsData
map.on('load', async () => {
  try {
    const res = await fetch('https://data.busrouter.sg/v1/stops.min.geojson')
    stopsData = await res.json()
    map.addSource('bus-stops', {
      type: 'geojson',
      data: stopsData
    })
    
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
    })
    
    map.on('click', 'bus-stops-layer', (e) => {
      const feature = e.features[0]
      const coords = feature.geometry.coordinates.slice()
      const props = feature.properties || {}
      
      const html = `
      <strong>${props.name || 'Unknown'}</strong> <br>
      <strong>Stop ID:</strong> <span id="stopNo">${props.number || 'N/A'}</span><br>
      <button id="lockIn">Lock in</button>
      `
      new maplibregl.Popup().setLngLat(coords).setHTML(html).addTo(map)
      updateButton()
    })
    
    map.on('mouseenter', 'bus-stops-layer', () => map.getCanvas().style.cursor = 'pointer')
    map.on('mouseleave', 'bus-stops-layer', () => map.getCanvas().style.cursor = '')
  } catch (err) {console.error('Error loading stops:', err)}
})

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://xowfiaodrlbghhoobmbm.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvd2ZpYW9kcmxiZ2hob29ibWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTI4MDQsImV4cCI6MjA3NjM2ODgwNH0.eOze-pW1rD7TN9-fR7FTA4QMcG3Mcip7RIZmAInQ7z0"
const supabase = createClient(supabaseUrl, supabaseKey)
let imgNo, imgName
async function getImgUrl() {
  const { data, error } = await supabase.storage.from('Images').list()
  if (error) {
    console.error(error)
  } else {
    imgName = data[Math.floor(Math.random()*data.length)].name
    imgNo = imgName.slice(0,3)
    console.log(imgNo)
    return supabase.storage.from('Images').getPublicUrl(imgName).data.publicUrl
  }
}
const mainimg = document.querySelector("#mainimg")
getImgUrl().then(url => {mainimg.src = url})
async function loadStops() {
  const { data, error } = await supabase.from('stops').select()
  
  if (error) console.error(error) 
    else {
    let ans = data.find(i => i.img_no == imgNo)
    console.log(ans.stop_no,guess)
    let guessLocation = new LngLat(...getLngLatById(guess))
    let ansLocation = new LngLat(...getLngLatById(ans.stop_no))
    console.log(guessLocation.distanceTo(ansLocation))
    map.addSource('route', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            getLngLatById(ans.stop_no),
            getLngLatById(guess),
          ]
        }
      }
    }
    )
  map.addLayer({
    'id': 'route',
    'type': 'line',
    'source': 'route',
    'layout': {
      'line-join': 'round',
      'line-cap': 'round'
    },
    'paint': {
      'line-color': '#248623',
      'line-width': 8
    }
  });
  map.flyTo({center: getLngLatById(ans.stop_no), zoom: 16, speed:0.67})
}
}
function updateButton(){
  lockInButton = document.querySelector("#lockIn")
  lockInButton.addEventListener("click", loadStops)
  stopNoSpan = document.querySelector("#stopNo")
  guess = stopNoSpan.textContent
}
function getLngLatById(id) {
  const feature = stopsData.features.find(f => f.id === id)
  return feature?.geometry.coordinates
}