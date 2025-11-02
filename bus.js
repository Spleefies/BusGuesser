import maplibregl, { LngLat, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/satellite/style.json?key=cRXF0Q8VCbwDnBOhhfNP',
  center: [103.818108, 1.3431684],
  zoom: 11
})
let stopsData, popup
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
          12, 6,
          14, 10,
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
      popup = new maplibregl.Popup().setLngLat(coords).setHTML(html).addTo(map)
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
    let guessLocation = new LngLat(...getLngLatById(guess))
    let ansLocation = new LngLat(...getLngLatById(ans.stop_no))
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
      'line-color': '#3fb1ce',
      'line-width': 8
    }
  });
  new Marker().setLngLat(getLngLatById(ans.stop_no)).addTo(map)
  new Marker().setLngLat(getLngLatById(guess)).addTo(map)
  popup.remove()
  map.flyTo({center: getLngLatById(ans.stop_no), zoom: 16, speed:0.67})
  searchDiv.style.display = 'block'
  searchDiv.innerHTML = `Your guess was <b>${Math.floor(guessLocation.distanceTo(ansLocation))/1000}</b>km from the actual location<br><button onclick="window.location.reload()">Play again <img src="../play.svg"></button>`
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
const searchInput = document.querySelector(".search input")
const searchDiv = document.querySelector(".search")
searchInput.addEventListener("change", () => {
  map.flyTo({center: getLngLatById(searchInput.value), zoom: 20})
  searchDiv.style.display = "none"
})