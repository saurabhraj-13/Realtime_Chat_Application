
import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

function LocationMessages({
  messages = [],
  activeSOS = {},
  activeLiveLocations = {},
  username,
  getLocationData,
  onOpenMap,
  onStopSOS,
  onStopLiveLocation
}) {
  return (
    <>
      {/* SOS ALERTS */}
      {Object.values(activeSOS).map((sos) => (
        <div
          className="sos-alert-banner"
          key={`sos-${sos.user}`}
        >
          <div className="sos-alert-icon">🚨</div>

          <div className="sos-alert-content">
            <strong>SOS ALERT</strong>

            <span>
              {sos.user === username
                ? "You activated SOS"
                : `${sos.user} needs help!`}
            </span>

            <small>🔴 Live location is being shared</small>
          </div>

          <button
            type="button"
            className="sos-map-button"
            onClick={() =>
              onOpenMap(sos.latitude, sos.longitude)
            }
          >
            📍 Open Map
          </button>
        </div>
      ))}

      {/* SHARED LOCATION MESSAGES */}
      {messages.map((msg, index) => {
        const location = getLocationData(msg);

        if (!location) {
          return null;
        }

        return (
          <div
            className="location-message-card"
            key={msg._id || `location-${index}`}
            onClick={() =>
              onOpenMap(
                location.latitude,
                location.longitude
              )
            }
            title="Open location in Google Maps"
            style={{ cursor: "pointer" }}
          >
            <MapContainer
              key={`${location.latitude}-${location.longitude}-${index}`}
              center={[
                location.latitude,
                location.longitude
              ]}
              zoom={15}
              scrollWheelZoom={false}
              dragging={false}
              doubleClickZoom={false}
              touchZoom={false}
              className="location-map"
              style={{ pointerEvents: "none" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker
                position={[
                  location.latitude,
                  location.longitude
                ]}
              >
                <Popup>
                  📍 {msg.user}'s location
                </Popup>
              </Marker>
            </MapContainer>

            <div className="location-info">
              <strong>📍 Shared Location</strong>
              <span>{msg.user} shared their location</span>
              <small>Click map to open Google Maps</small>
            </div>
          </div>
        );
      })}

      {/* LIVE LOCATION CARDS */}
      {Object.values(activeLiveLocations).map((location) => {
        const isMine = location.user === username;
        const hasSOS = Boolean(activeSOS[location.user]);

        return (
          <div
            className={
              hasSOS
                ? "live-location-container sos-live-location"
                : "live-location-container"
            }
            key={`live-${location.user}`}
          >
            <div className="live-location-header">
              <strong>
                {hasSOS
                  ? "🚨 SOS LIVE LOCATION"
                  : "🔴 Live Location"}
              </strong>

              <span>{isMine ? "You" : location.user}</span>
            </div>

            <div
              onClick={() =>
                onOpenMap(
                  location.latitude,
                  location.longitude
                )
              }
              title="Open live location in Google Maps"
              style={{ cursor: "pointer" }}
            >
              <MapContainer
                key={`${location.user}-${location.latitude}-${location.longitude}`}
                center={[
                  location.latitude,
                  location.longitude
                ]}
                zoom={16}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                touchZoom={false}
                className="live-location-map"
                style={{ pointerEvents: "none" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                  position={[
                    location.latitude,
                    location.longitude
                  ]}
                >
                  <Popup>
                    {hasSOS
                      ? "🚨 SOS location of "
                      : "🔴 Live location of "}
                    {location.user}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="live-location-footer">
              <span>
                {hasSOS
                  ? "🚨 SOS is active • Live location sharing"
                  : "🔴 Live location is active"}
              </span>

              <button
                type="button"
                className="google-map-live-button"
                onClick={() =>
                  onOpenMap(
                    location.latitude,
                    location.longitude
                  )
                }
              >
                📍 Open Google Maps
              </button>

              {isMine && (
                <button
                  type="button"
                  className="stop-live-location"
                  onClick={
                    hasSOS
                      ? onStopSOS
                      : onStopLiveLocation
                  }
                >
                  {hasSOS ? "🛑 Stop SOS" : "Stop Sharing"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default LocationMessages;