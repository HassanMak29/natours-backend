/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaGFzc2FubWFrMjkiLCJhIjoiY2t4Z25yN3RmMms0dTMwbzE3MzVsZmg2cSJ9.Txb7-sbSByU7yu5Crownbw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/hassanmak29/ckxgo6rad4fxb14oexkpe9lxl',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 8,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //   Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //   Exrtend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 180,
      bottom: 100,
      left: 100,
      right: 100,
    },
  });
};
