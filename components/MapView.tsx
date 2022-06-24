
import React, { useMemo, useState } from "react";
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


import { useGeolocated } from "react-geolocated";
css');

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZ2xhc3RvaW8iLCJhIjoiY2w0c29mdGY2MGlzaTNrcDhvd2YwNXhrNiJ9.I1OyrrdOMdR7Z0DLeqSvjw'
});


export default function MapView({  }) {
  const location = useGeolocated()
  

  return (
    <div className="p-5 container mx-auto max-w-[750px]">Coming Soon 😋
    <Map
  style="mapbox://styles/mapbox/streets-v9"
  containerStyle={{
    height: '100vh',
    width: '100vw'
  }}
>
  <Layer type="symbol" id="marker" layout={{ 'icon-image': 'marker-15' }}>
    <Feature coordinates={[-0.481747846041145, 51.3233379650232]} />
  </Layer>
</Map>;
                             </div>
  )
}
