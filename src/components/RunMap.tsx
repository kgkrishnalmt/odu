'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function RunMap({ coords }: { coords: [number, number][] }) {
  const mapRef = useRef<L.Map | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([20.5937, 78.9629], 15) // default center India

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current)

    polylineRef.current = L.polyline([], { color: '#ffffff', weight: 4 }).addTo(mapRef.current)
  }, [])

  useEffect(() => {
    if (!mapRef.current || coords.length === 0) return

    polylineRef.current?.setLatLngs(coords)

    const latest = coords[coords.length - 1]

    // Update or create current position marker
    if (markerRef.current) {
      markerRef.current.setLatLng(latest)
    } else {
      markerRef.current = L.circleMarker(latest, {
        radius: 8,
        color: '#fff',
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 2,
      }).addTo(mapRef.current)
    }

    mapRef.current.panTo(latest)
  }, [coords])

  return <div ref={containerRef} className="w-full h-full min-h-[50vh]" />
}