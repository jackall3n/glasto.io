
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

  const [user, loading, , updateUser] = useDocument<IUser>("users", authUser?.uid);

  const [, col] = useCollection<any>(["users", authUser?.uid, "locations"]); 
  
  const geolocation = useGeolocated({ watchPosition: true} )
  const { coords, timestamp } = geolocation;
  
  console.log({ geolocation }); 
  
  const zoom = useMemo(() => [17], []);
  const location = useMemo<[number, number]>(() => {
  return coords ? [ coords.longitude, coords.latitude] as const: undefined
   }, [coords?.longitude, coords?.latitude]);
   
   useEffect(() => { 
     if (!location || !authUser) {
      return
     }
   
     updateUser({ 
       location
     })
     
     if (col) { 
     const ref = doc(col, String(timestamp))
     setDoc(ref, { coordinates: location })
     }
    
    
   }, [location]);
  
  return (
    <div className="container mx-auto max-w-[750px]">
    <Map
  style="mapbox://styles/mapbox/streets-v9"
  containerStyle={{
    height: '100vh',
    width: '100vw'
  }}
  zoom={zoom}
  center={location}
>
{coords && (
  <Layer type="symbol" id="marker" layout={{ 'icon-image': 'circle-15' }}>
    <Feature coordinates={location} />
  </Layer>
  )}
</Map>

{JSON.stringify(location)}
                             </div>
  )
}
