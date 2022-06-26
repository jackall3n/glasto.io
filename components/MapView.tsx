
import React, { useMemo, useState, useEffect } from "react";
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAuth } from "../providers/AuthProvider";
import { useCollection } from "../hooks/useCollection";
import { useDocument } from "../hooks/useDocument";
import { IUser } from '../types/user';
import { doc, setDoc } from "firebase/firestore"; 

import { useGeolocated } from "react-geolocated";

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZ2xhc3RvaW8iLCJhIjoiY2w0c29mdGY2MGlzaTNrcDhvd2YwNXhrNiJ9.I1OyrrdOMdR7Z0DLeqSvjw'
});


export default function MapView({  }) {
  const [authUser, login] = useAuth();

  const [user, loading, doc, updateUser] = useDocument<IUser>("users", authUser?.uid);

  const [, col] = useCollection<any>(["users", authUser?.uid, "locations"]); 
  
  const location = useGeolocated({ watchPosition: true} )
  const { coords } = location;
  
  console.log({ location }); 
  
  const zoom = useMemo(() => [17], []);
  const center = useMemo(() => {
  return coords ? [ coords.longitude, coords.latitude] : undefined
   }, [coords?.longitude, coords?.latitude]);
   
   useEffect(() => { 
     if (!coords || !authUser) {
      return
     }
   
     updateUser({ 
       location: [coords.longitude, coords.latitude]
     })
     
     if (col) { 
     const ref = doc(col, String(timestamp))
     setDoc(ref, { coordinates: coords })
     }
    
    
   }, [coords?.longitude, coords?.latitude]);
  
  return (
    <div className="container mx-auto max-w-[750px]">
    <Map
  style="mapbox://styles/mapbox/streets-v9"
  containerStyle={{
    height: '100vh',
    width: '100vw'
  }}
  zoom={zoom}
  center={center}
>
{coords && (
  <Layer type="symbol" id="marker" layout={{ 'icon-image': 'circle-15' }}>
    <Feature coordinates={center} />
  </Layer>
  )}
</Map>

{JSON.stringify(location)}
                             </div>
  )
}
