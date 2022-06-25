
import React, { useMemo, useState } from "react";
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


import { useGeolocated } from "react-geolocated";

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZ2xhc3RvaW8iLCJhIjoiY2w0c29mdGY2MGlzaTNrcDhvd2YwNXhrNiJ9.I1OyrrdOMdR7Z0DLeqSvjw'
});


export default function MapView({  }) {
  const { coords } = useGeolocated()
  
  return (
    <div className="container mx-auto max-w-[750px]">Coming Soon 😋
    <Map
  style="mapbox://styles/mapbox/streets-v9"
  containerStyle={{
    height: '100vh',
    width: '100vw'
  }}
>
{coords && (
  <Layer type="symbol" id="marker" layout={{ 'icon-image': 'marker-15' }}>
    <Feature coordinates={[coords.latitude, coords.longitude]} />
  </Layer>
  )}
</Map>;
                             </div>
  )
}
