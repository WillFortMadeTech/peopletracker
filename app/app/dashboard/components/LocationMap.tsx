"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, Polyline as LeafletPolyline } from "leaflet";
import { Location } from "@/lib/locations";
import { useSocketContext } from "./SocketProvider";

interface FriendLocation {
  friendId: string;
  username: string;
  profileImageUrl?: string;
  location: Location | null;
}

interface LocationUpdate {
  friendId: string;
  username: string;
  profileImageUrl?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  };
}

interface LocationMapProps {
  currentUsername: string;
}

export default function LocationMap({ currentUsername }: LocationMapProps) {
  const [myLocations, setMyLocations] = useState<Location[]>([]);
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { on } = useSocketContext();

  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const polylineRef = useRef<LeafletPolyline | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const [myRes, friendsRes] = await Promise.all([
        fetch("/api/locations?limit=50"),
        fetch("/api/locations/friends"),
      ]);

      if (myRes.ok) {
        const data = await myRes.json();
        setMyLocations(data.locations);
      }

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriendLocations(data.friendLocations);
      }

      setError(null);
    } catch (err) {
      setError("Failed to fetch locations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 60000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // Listen for real-time location updates from friends
  useEffect(() => {
    const unsubscribe = on("location_update", (data: LocationUpdate) => {
      console.log("[LocationMap] Received real-time location update:", data);

      setFriendLocations((prev) => {
        const existingIndex = prev.findIndex((f) => f.friendId === data.friendId);
        const updatedFriend: FriendLocation = {
          friendId: data.friendId,
          username: data.username,
          profileImageUrl: data.profileImageUrl,
          location: {
            id: "",
            userId: data.friendId,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            accuracy: data.location.accuracy,
            timestamp: data.location.timestamp,
          },
        };

        if (existingIndex >= 0) {
          // Update existing friend's location
          const updated = [...prev];
          updated[existingIndex] = updatedFriend;
          return updated;
        } else {
          // Add new friend location
          return [...prev, updatedFriend];
        }
      });
    });

    return () => unsubscribe();
  }, [on]);

  // Listen for friend profile updates (e.g., profile picture changes)
  useEffect(() => {
    const unsubscribe = on("friend_profile_updated", (data: { friendId: string; username: string; profileImageUrl?: string }) => {
      console.log("[LocationMap] Received friend profile update:", data);

      setFriendLocations((prev) =>
        prev.map((f) =>
          f.friendId === data.friendId
            ? {
                ...f,
                username: data.username,
                profileImageUrl: data.profileImageUrl,
              }
            : f
        )
      );
    });

    return () => unsubscribe();
  }, [on]);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let link: HTMLLinkElement | null = null;
    let isMounted = true;

    const initMap = async () => {
      // Check if CSS is already loaded
      const existingLink = document.querySelector('link[href*="leaflet.css"]');

      if (!existingLink) {
        // Load Leaflet CSS
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);

        // Wait for CSS to load
        await new Promise<void>((resolve) => {
          link!.onload = () => resolve();
          link!.onerror = () => resolve(); // Continue even if CSS fails
        });
      }

      if (!isMounted) return;

      // Load Leaflet
      const L = await import("leaflet");

      if (!isMounted) return;

      leafletRef.current = L;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapContainerRef.current && !mapRef.current) {
        const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapRef.current = map;

        // Force a resize after map is created to ensure tiles load
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            setMapReady(true);
          }
        }, 100);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
      // Don't remove CSS as it may be used by other components
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Debug logging
    console.log("[LocationMap] Updating markers:", {
      myLocationsCount: myLocations.length,
      friendLocationsCount: friendLocations.length,
      friendsWithLocation: friendLocations.filter(f => f.location).length,
      friendLocations: friendLocations,
    });

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
    };

    // Create custom icon for user (blue)
    const userIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background-color: #3b82f6;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });

    // Create custom icon for friends (green dot - used when no profile picture)
    const createFriendIcon = (profileImageUrl?: string) => {
      if (profileImageUrl) {
        // Use profile picture as marker
        return L.divIcon({
          className: "custom-marker-profile",
          html: `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 3px solid #22c55e;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              overflow: hidden;
              background-color: white;
            ">
              <img
                src="${profileImageUrl}"
                alt=""
                style="width: 100%; height: 100%; object-fit: cover;"
                onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'background:#22c55e;width:100%;height:100%;\\'></div>'"
              />
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });
      } else {
        // Default green dot
        return L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              background-color: #22c55e;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10],
        });
      }
    };

    // Add my location marker
    const myLatestLocation = myLocations[0];
    if (myLatestLocation) {
      console.log("[LocationMap] Adding user marker at:", myLatestLocation.latitude, myLatestLocation.longitude);
      const marker = L.marker(
        [myLatestLocation.latitude, myLatestLocation.longitude],
        { icon: userIcon }
      )
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 14px;">
            <strong>${currentUsername} (You)</strong><br/>
            ${formatTime(myLatestLocation.timestamp)}
            ${myLatestLocation.accuracy ? `<br/>Accuracy: ${Math.round(myLatestLocation.accuracy)}m` : ""}
          </div>
        `);
      markersRef.current.push(marker);

      // Center map on my location
      map.setView([myLatestLocation.latitude, myLatestLocation.longitude], 13);
    }

    // Add location history polyline
    if (showHistory && myLocations.length > 1) {
      const coords = myLocations.map((loc) => [loc.latitude, loc.longitude] as [number, number]);
      polylineRef.current = L.polyline(coords, {
        color: "#3b82f6",
        weight: 3,
        opacity: 0.6,
      }).addTo(map);
    }

    // Add friend location markers
    friendLocations.forEach((friend) => {
      if (friend.location) {
        console.log("[LocationMap] Adding friend marker:", friend.username, "at:", friend.location.latitude, friend.location.longitude, "profileImage:", friend.profileImageUrl);
        const marker = L.marker(
          [friend.location.latitude, friend.location.longitude],
          { icon: createFriendIcon(friend.profileImageUrl) }
        )
          .addTo(map)
          .bindPopup(`
            <div style="font-size: 14px;">
              <strong>${friend.username}</strong><br/>
              ${formatTime(friend.location.timestamp)}
              ${friend.location.accuracy ? `<br/>Accuracy: ${Math.round(friend.location.accuracy)}m` : ""}
            </div>
          `);
        markersRef.current.push(marker);
      } else {
        console.log("[LocationMap] Friend has no location:", friend.username);
      }
    });

    // Fit bounds to show all markers if we have friends with locations
    const friendsWithLoc = friendLocations.filter(f => f.location);
    if (myLatestLocation && friendsWithLoc.length > 0) {
      const allCoords: [number, number][] = [
        [myLatestLocation.latitude, myLatestLocation.longitude],
        ...friendsWithLoc.map(f => [f.location!.latitude, f.location!.longitude] as [number, number])
      ];
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [myLocations, friendLocations, showHistory, currentUsername, mapReady]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
              className="rounded"
            />
            Show my location history
          </label>
        </div>
        <button
          onClick={fetchLocations}
          disabled={loading}
          className="text-sm px-3 py-1 border-2 border-black rounded hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="relative" style={{ zIndex: 0, isolation: "isolate" }}>
        <div
          ref={mapContainerRef}
          className="h-96 rounded-lg border-2 border-black overflow-hidden"
          style={{ minHeight: "384px", position: "relative", zIndex: 0 }}
        />
        {(!mapReady || loading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-black">
            <span className="text-gray-500">Loading map...</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></span>
          <span>You</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"></span>
          <span>Friends ({friendLocations.filter(f => f.location).length})</span>
        </div>
        {myLocations.length === 0 && friendLocations.filter(f => f.location).length === 0 && (
          <span className="text-gray-400 ml-2">No locations available yet</span>
        )}
        {friendLocations.length > 0 && friendLocations.filter(f => f.location).length === 0 && (
          <span className="text-gray-400 ml-2">
            (Friends must enable location sharing)
          </span>
        )}
      </div>
    </div>
  );
}
