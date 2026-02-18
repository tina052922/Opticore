"use client";

import { MapContainer, ImageOverlay, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";

type Props = {
  roomQuery: string;
};

// NOTE: This uses a static image as map background so it works fully offline.
// Drop your real CTU–Argao campus map image at /public/images/campus-map.png
const imageBounds: L.LatLngBoundsExpression = [
  [0, 0],
  [1000, 1000]
];

const ROOMS = [
  {
    code: "DT Lab1",
    building: "DT",
    floor: 2,
    position: [400, 600] as [number, number],
    directions:
      "From Main Gate → walk straight 50m to DT Building → take stairs to 2nd floor → room on the left wing."
  },
  {
    code: "CT Lab2",
    building: "CT",
    floor: 1,
    position: [600, 300] as [number, number],
    directions:
      "From Main Gate → proceed to CT Building on the right → enter main lobby → lab is beside the registrar."
  }
];

const PATH_MAIN_GATE_TO_DT: [number, number][] = [
  [50, 100],
  [200, 250],
  [350, 400]
];

export default function CampusMap({ roomQuery }: Props) {
  const filteredRooms = useMemo(() => {
    if (!roomQuery) return ROOMS;
    const q = roomQuery.toLowerCase();
    return ROOMS.filter(r => r.code.toLowerCase().includes(q));
  }, [roomQuery]);

  return (
    <div className="glass-panel h-[520px] w-full overflow-hidden rounded-2xl">
      <MapContainer
        center={[500, 500]}
        zoom={0}
        minZoom={-1}
        maxZoom={2}
        crs={L.CRS.Simple}
        className="h-full w-full"
      >
        <ImageOverlay
          url="/images/campus-map.png"
          bounds={imageBounds}
          opacity={0.9}
        />
        {filteredRooms.map(room => (
          <Marker
            key={room.code}
            position={room.position}
            icon={L.icon({
              iconUrl:
                "data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='10' fill='%23004AAD' stroke='white' stroke-width='3'/%3E%3C/svg%3E",
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{room.code}</p>
                <p className="text-[11px] text-slate-600">
                  Building {room.building}, {room.floor}F
                </p>
                <p className="mt-1 text-[11px]">
                  {/* When schedules are wired, show today's schedule summary here. */}
                  <span className="font-medium">Today:</span> No schedule data
                  yet (demo state).
                </p>
                <p className="mt-1 text-[11px] leading-snug">
                  <span className="font-medium">Directions:</span>{" "}
                  {room.directions}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Simple path highlighting from Main Gate to DT Lab zone */}
        <Polyline positions={PATH_MAIN_GATE_TO_DT} color="#00B8A9" weight={4} />
      </MapContainer>
    </div>
  );
}

