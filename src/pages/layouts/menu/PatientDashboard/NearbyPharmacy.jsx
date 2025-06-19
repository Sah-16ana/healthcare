import React, { useState, useEffect } from "react";
import {
  MapPin, Phone, Clock, Building, Search, Loader2, Navigation,
} from "lucide-react";

function NearbyPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (userLocation) fetchNearbyPharmacies(userLocation.lat, userLocation.lon);
  }, [userLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError(null);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ", India")}&format=json&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (!data[0]?.lat) return setError("Location not found.");
        setUserLocation({ lat: data[0].lat, lon: data[0].lon });
      })
      .catch(() => setError("Failed to search location."))
      .finally(() => setSearchLoading(false));
  };

  const getUserLocation = () => {
    setLoading(true);
    setLocationError(null);
    setError(null);
    navigator.geolocation?.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`);
          const data = await res.json();
          setUserLocation({ lat: coords.latitude, lon: coords.longitude, address: data.display_name });
        } catch {
          setUserLocation({ lat: coords.latitude, lon: coords.longitude, address: "Location found" });
        }
      },
      (err) => {
        setLoading(false);
        const messages = {
          1: "Please allow location access.",
          2: "Location unavailable.",
          3: "Location request timed out.",
        };
        setLocationError(messages[err.code] || "Unknown location error.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchPharmacyAddress = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await res.json();
      return data.display_name || "Address not found";
    } catch {
      return "Error fetching address";
    }
  };

  const fetchNearbyPharmacies = async (lat, lon) => {
    try {
      const query = `[out:json][timeout:25];(node["amenity"="pharmacy"](around:5000,${lat},${lon});way["amenity"="pharmacy"](around:5000,${lat},${lon}));out body;>;out skel qt;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      const { elements } = await res.json();
      const nodes = elements.filter((e) => e.type === "node");
      if (!nodes.length) return setError("No pharmacies found nearby.");
      const results = await Promise.all(nodes.map(async (e) => ({
        id: e.id,
        name: e.tags?.name || "Unknown Pharmacy",
        address: await fetchPharmacyAddress(e.lat, e.lon),
        phone: e.tags?.phone || "Not available",
        opening_hours: e.tags?.opening_hours || "Hours not available",
        lat: e.lat,
        lon: e.lon,
        distance: calculateDistance(lat, lon, e.lat, e.lon),
      })));
      setPharmacies(results.sort((a, b) => a.distance - b.distance));
    } catch {
      setError("Failed to fetch nearby pharmacies.");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);
  const formatDistance = (d) => (d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`);

  return (
    <div className="p-6 mt-6 shadow-lg rounded-2xl">
      <div className="pharmacy-content">
        <header className="pharmacy-header text-center mb-6">
          <div className="pharmacy-icon-container">
            <Building className="pharmacy-icon mx-auto" />
          </div>
          <p className="paragraph text-2xl font-bold">Nearby Pharmacies</p>
          <p className="paragraph mb-4">Find pharmacies near your location</p>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location (e.g., Mumbai, Delhi)"
              className="input-field max-w-md my-4"
            />
            <button type="submit" disabled={searchLoading} className="view-btn btn mt-2 mx-auto">
              {searchLoading ? <Loader2 className="loading-icon" /> : "Search"}
            </button>
          </form>

          <button onClick={getUserLocation} disabled={loading} className="btn btn-primary mt-4 mx-auto">
            {loading ? (
              <>
                <Loader2 className="loading-icon" />
                <span>Getting Location...</span>
              </>
            ) : (
              <>
                <Navigation className="nav-icon" />
                <span>Use My Location</span>
              </>
            )}
          </button>

          {locationError && <p className="error-message mt-2">{locationError}</p>}
          {userLocation?.address && <p className="success-message mt-2">Current location: {userLocation.address}</p>}
        </header>

        {loading && <div className="loading-container"><Loader2 className="loading-icon large" /></div>}
        {error && <p className="error-container">{error}</p>}

        <div className="pharmacy-grid grid gap-4 mt-6">
          {pharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="pharmacy-card shadow-md rounded-xl p-4">
              <div className="pharmacy-card-header flex justify-between items-center mb-2">
                <p className="paragraph font-semibold">{pharmacy.name}</p>
                <span className="distance-badge">{formatDistance(pharmacy.distance)}</span>
              </div>
              <div className="pharmacy-details space-y-2">
                <div className="pharmacy-detail-item flex items-start gap-2">
                  <MapPin className="detail-icon mt-1" />
                  <p className="paragraph">{pharmacy.address}</p>
                </div>
                <div className="pharmacy-detail-item flex items-start gap-2">
                  <Phone className="detail-icon mt-1" />
                  <p className="paragraph">{pharmacy.phone}</p>
                </div>
                <div className="pharmacy-detail-item flex items-start gap-2">
                  <Clock className="detail-icon mt-1" />
                  <p className="paragraph">{pharmacy.opening_hours}</p>
                </div>
              </div>
              <div className="pharmacy-card-footer text-right mt-4">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.lat},${pharmacy.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  Get Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NearbyPharmacies;
