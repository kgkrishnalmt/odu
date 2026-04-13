'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function SummaryMap({ route }: { route: [number, number][] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current || route.length === 0) return

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current)

    const polyline = L.polyline(route, { color: '#ffffff', weight: 4 })
    polyline.addTo(mapRef.current)
    mapRef.current.fitBounds(polyline.getBounds(), { padding: [32, 32] })
  }, [route])

  return <div ref={containerRef} className="w-full h-full" />
}