
import React, { useMemo, useState } from "react";
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


import { useGeolocated } from "react-geolocated";

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZ2xhc3RvaW8iLCJhIjoiY2w0c29mdGY2MGlzaTNrcDhvd2YwNXhrNiJ9.I1OyrrdOMdR7Z0DLeqSvjw'
});


export default function MapView({  }) {
  const location = useGeolocated({ watchPosition: true} )
  const { coords } = location;
  
  console.log({ location }); 
  
  return (
    <div className="container mx-auto max-w-[750px]">
    <Map
  style="mapbox://styles/mapbox/streets-v9"
  containerStyle={{
    height: '100vh',
    width: '100vw'
  }}
  zoom={[5]}
  center={coords ? [ coords.longitude, coords.latitude] : undefined }
>
{coords && (
  <Layer type="symbol" id="marker" layout={{ 'icon-image': 'circle-15' }}>
    <Feature coordinates={[coords.longitude, coords.latitude]} />
  </Layer>
  )}
</Map>

{JSON.stringify(location)}
                             </div>
  )
}
