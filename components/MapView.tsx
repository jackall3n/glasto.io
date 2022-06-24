import { format, addHours, isAfter } from "date-fns";
import React, { useMemo, useState } from "react";
import { groupBy, orderBy, uniq } from "lodash";
import copy from 'copy-to-clipboard';
import { CalendarIcon } from "@heroicons/react/solid";

import { useGeolocated } from "react-geolocated";

export default function MapView({  }) {
  const location = useGeolocated()
  

  return (
    <div className="p-5 container mx-auto max-w-[750px]">Coming Soon 😋
                             </div>
  )
}
