import React, { useEffect, useMemo } from "react";
import ReactMapboxGl, { Feature, Layer } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAuth } from "../providers/AuthProvider";
import { useCollection } from "../hooks/useCollection";
import { useDocument } from "../hooks/useDocument";
import { IUser } from '../types/user';
import { GeoPoint, serverTimestamp, Timestamp } from "firebase/firestore";

import { useGeolocated } from "react-geolocated";

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoiZ2xhc3RvaW8iLCJhIjoiY2w0c29mdGY2MGlzaTNrcDhvd2YwNXhrNiJ9.I1OyrrdOMdR7Z0DLeqSvjw',
});

export default function MapView({ users }) {
  const [authUser] = useAuth();

  const [, , , updateUser] = useDocument<IUser>("users", authUser?.uid);

  const [locations, reference, { add }] = useCollection<any>(["users", authUser?.uid, "locations"]);

  console.log(users);

  const geolocation = useGeolocated({ watchPosition: true })

  const { coords, timestamp } = geolocation;

  console.log({ geolocation });

  const zoom = useMemo<[number]>(() => [17], []);

  const location = useMemo(() => {
    if (!coords) {
      return undefined;
    }

    const { latitude, longitude } = coords;

    return {
      coords: [longitude, latitude] as [number, number],
      geo: new GeoPoint(latitude, longitude)
    }
  }, [coords?.longitude, coords?.latitude]);

  async function pingLocation() {
    if (!location || !authUser) {
      return
    }

    const data = {
      timestamp: serverTimestamp() as Timestamp,
      point: location.geo,
    }

    await updateUser({
      location: data
    });

    if (reference) {
      await add(timestamp, data);
    }
  }

  useEffect(() => {
    pingLocation().then()
  }, [location]);

  return (
    <div className="min-h-[100vh] flex flex-col relative">
      <div className="absolute top-5 left-5 z-50 bg-white p-2 rounded-md">
        {JSON.stringify(location?.geo)}
      </div>
      <Map
        style="mapbox://styles/mapbox/streets-v9"
        className="flex-1"
        zoom={zoom}
        center={location?.coords}
      >
        {location && (
          <Layer type="symbol" id="marker" layout={{ 'icon-image': 'cat' }}>
            <Feature coordinates={location.coords} />
          </Layer>
        )}

        {users.map(user => {
          const { id, location } = user;

          if (!location?.point) {
            return <React.Fragment key={id} />
          }

          const { point } = location;

          console.log()

          return (
            <Layer key={id} type="symbol" id="marker" layout={{ 'icon-image': 'cat' }}>
              <Feature coordinates={[point.longitude, point.latitude]} />
            </Layer>
          )
        })}
      </Map>
    </div>
  )
}
