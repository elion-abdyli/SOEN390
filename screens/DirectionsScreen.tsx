import React, { useState, useRef, useEffect } from "react";
import { View, Text , TouchableOpacity} from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  LatLng,
  Callout,
  Polyline,
  Geojson
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { DirectionsScreenStyles } from "@/Styles/MapStyles";
import { GOOGLE_MAPS_API_KEY } from "@/constants/GoogleKey";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { useRoute } from "@react-navigation/native";
import { retrieveRoutes } from "@/services/DirectionService";
import { findNextShuttle } from "@/services/ShuttleService";
import {  } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";

import { getTripDuration } from "@/services/DurationService";
import { Building, Floor, getBuildingOutlines, getBuildingMarkers, getBuilding } from "@/services/GISImporterService";
import { 
  extractBuildingFromCode, 
  extractFloorFromCode, 
  routeToRoom, 
  indoorToOutdoor, 
  outdoorToIndoor 
} from "@/services/IndoorDirService";

import {
  SGW_CAMPUS,
} from "@/constants/MapsConstants";

const BASE_PADDING = 50;

export default function DirectionsScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [indoorPaths1, setIndoorPaths1] = useState<Array<PathFloorBundle>>([]);
  const [selectedIndoorPathIndex1, setSelectedIndoorPathIndex1] = useState<number>(0);
  const [destiProperties, setRouteRequestProperties] = useState<any>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);

  type RouteParams = {
    destination?: {
      ClassroomCode: string;
      Properties: any;
      Address: string;
      Latitude: number;
      Longitude: number;
    };
  };

  class PathFloorBundle {
    buildingName: string;
    floorName: string;
    path: Array<any>;
    constructor(buildingName: string, floorname: string, path: Array<any>) {
      this.buildingName = buildingName;
      this.floorName = floorname;
      this.path = path;
    }
  }

  const route = useRoute<{ key: string; name: string; params: RouteParams }>();

  const destinationObject = route.params?.destination; // pass destination to second screen
  const [directionsRoute, setDirectionsRoute] = useState<LatLng | null>(null); // create directions route state
  const [transportMode, setTransportMode] = useState<
    "DRIVING" | "WALKING" | "TRANSIT"
  >("DRIVING");
  const HALL_BUILDING: LatLng = {
    latitude: 45.4973223,
    longitude: -73.5790288,
  }; // start point of shuttle routing
  const LOYOLA_CAMPUS: LatLng = {
    latitude: 45.4581244,
    longitude: -73.6391259,
  }; // end point of shuttle routing

  const [shuttleValid, setShuttleValid] = useState(false);
  const [showShuttleTime, setShowShuttleTime] = useState(false); // this tracks the button press for shuttle and shows time till next shuttle

  useEffect(() => {
    const loadSavedLocations = async () => {
      const savedOrigin = await AsyncStorage.getItem("origin");
      const savedDestination = await AsyncStorage.getItem("destination");
      if (savedOrigin) setOrigin(JSON.parse(savedOrigin));
      if (savedDestination) setDestination(JSON.parse(savedDestination));
    };
    loadSavedLocations();
  }, []);

  useEffect(() => {
    if (destinationObject) {

      if(destinationObject.Properties)
      {
        setRouteRequestProperties(destinationObject);
      }

      const initialDestinationSelect = async (
        setLocation: (loc: LatLng) => void,
        storageKey: string,
        destinationObject: any
      ) => {
        const position: LatLng = {
          latitude: destinationObject.Latitude,
          longitude: destinationObject.Longitude,
        };

        console.log("Selected Location:", position); // Debugging

        setLocation(position);
        await AsyncStorage.setItem(storageKey, JSON.stringify(position));

        const zoomLevel = details.types.includes("country") ? 5 : 0.02;

        moveTo(position, zoomLevel);
      };
      initialDestinationSelect(
        setDestination,
        "destination",
        destinationObject
      );
    }
  }, [destinationObject]);

  useEffect(() => {
    if (origin && destination) {
      const extraPadding = origin && destination ? 100 : 0; // extra padding to fit markers on screen properly
      const padding = BASE_PADDING + extraPadding - 40;

      mapRef.current?.fitToCoordinates([origin, destination], {
        edgePadding: {
          top: padding,
          right: padding,
          bottom: padding,
          left: padding,
        },
        animated: true,
      });

      traceRoute();
    }
  }, [origin, destination]);

  const moveTo = (position: LatLng, zoomLevel: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel,
      },
      1000
    );
  };

  const handleLocationSelect = async (
    details: any,
    setLocation: (loc: LatLng) => void,
    storageKey: string,
    destinationObject: any
  ) => {
    const position: LatLng = {
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
    };

    console.log("Selected Location:", position); // Debugging

    setLocation(position);
    await AsyncStorage.setItem(storageKey, JSON.stringify(position));

    const zoomLevel = details.types.includes("country") ? 5 : 0.02;

    if ((origin && !destination) || (!origin && destination)) {
      // if only one location marker is selected
      moveTo(position, zoomLevel); // zoom in onto it
    }
  };

  const traceRoute = async () => {
    console.log("Origin: ", origin);
    console.log("Destination ", destination);
    console.log("Attempting to route"); // show debugging
    if (origin && destination) {
      try {
        const directions = await retrieveRoutes(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude,
          transportMode,
          GOOGLE_MAPS_API_KEY
        );
        setDirectionsRoute(directions);

        if(destinationObject?.ClassroomCode)
        {
          const indoorDestinationPath = await outdoorToIndoor(destinationObject?.ClassroomCode, false)
          if(indoorDestinationPath)
          {
            setSelectedIndoorPathIndex1(0);
            let pathSegmentsArray: Array<PathFloorBundle> = []
            
            if(indoorDestinationPath.path1)
            {
              let pathCoordinates1 = indoorDestinationPath.path1.map( (point: any) => ( {
                latitude: JSON.parse(point)[1], longitude: JSON.parse(point)[0]
              } ) )
              const matchBuilding = destinationObject?.ClassroomCode.match(/^([A-Za-z]+)/);
              if (matchBuilding) {
                const buildingCode = matchBuilding[1].toUpperCase();
                const building = getBuilding(buildingCode);
                if(Object.keys(building.floors).length > 0)
                {
                  const floor = Object.values(building.floors)[0];
                  const floorCode = floor.id;
                  let pathSegment1 = new PathFloorBundle(buildingCode, floorCode, pathCoordinates1);
                  pathSegmentsArray.push(pathSegment1);
                }
              }
            }
            if(indoorDestinationPath.path2)
            {
              let pathCoordinates2 = indoorDestinationPath.path2.map( (point: any) => ( {
                latitude: JSON.parse(point)[1], longitude: JSON.parse(point)[0]
              } ) )
              const matchBuilding2 = destinationObject?.ClassroomCode.match(/^([A-Za-z]+)/);
              const matchFloor2 = destinationObject?.ClassroomCode.match(/\d+/);
              if (matchBuilding2 && matchFloor2) {
                const buildingCode2 = matchBuilding2[1].toUpperCase();
                const floorCode2 = buildingCode2 + matchFloor2[0][0];
                let pathSegment2 = new PathFloorBundle(buildingCode2, floorCode2, pathCoordinates2);
                pathSegmentsArray.push(pathSegment2);
              }
            }
            setIndoorPaths1(pathSegmentsArray);
          }
          else
          {
            setIndoorPaths1([]);
          }
        }
        else
        {
          setIndoorPaths1([]);
        }
      } catch (error) {
        console.error("Error fetching directions ", error);
      }
    }
  };

  const setShuttleRoute = async () => {
    console.log("Attempting to use shuttle service."); // Initial log to confirm function execution

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied"); // Notify user if permission is denied
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 10000, // Allow use of recent location within 10s
        timeout: 5000, // Fail if location isn't retrieved within 5s
      });

      const userLocation: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log("User's current location: ", userLocation); // Debugging

      // Get estimated time to each campus from user's location
      console.log("Fetching trip duration to Hall Building...");
      const timeToHallBuilding = await getTripDuration(
        userLocation,
        HALL_BUILDING,
        GOOGLE_MAPS_API_KEY
      );

      console.log("Fetching trip duration to Loyola Campus...");
      const timeToLoyolaCampus = await getTripDuration(
        userLocation,
        LOYOLA_CAMPUS,
        GOOGLE_MAPS_API_KEY
      );

      console.log(
        "Time to Loyola: " +
          timeToLoyolaCampus +
          ", time to Hall: " +
          timeToHallBuilding
      );

      if (timeToHallBuilding != null && timeToLoyolaCampus != null) {
        // both times need to exist
        if (timeToHallBuilding <= 5 || timeToLoyolaCampus <= 5) {
          // Shuttle only usable if either campus is ≤ 5 min away
          if (timeToHallBuilding < timeToLoyolaCampus) {
            // HALL is closer
            setDestination(LOYOLA_CAMPUS); // If Hall is closer, set Loyola as destination
            console.log("Hall is closer, setting destination to Loyola.");
          } else {
            // LOYOLA is closer
            setDestination(HALL_BUILDING); // If Loyola is closer, set Hall as destination
            console.log("Loyola is closer, setting destination to Hall.");
          }

          setOrigin(userLocation); // Set user's current location as the trip origin
          setTransportMode("DRIVING"); // Mode is driving since the shuttle is a driving type vehicle
          setShuttleValid(true); // Set shuttle valid to true since shuttle route exists

          console.log("Beginning shuttle service...");
          await traceRoute(); // Start navigation based on the new origin and destination
        } else {
          console.log("Too far from both campuses to use Shuttle Service."); // User is too far from either campus to use the shuttle
          setShuttleValid(false);
        }
      } else {
        console.log("One or both of travel times are null."); // Travel times cannot be retrieved and no error code was raised
      }
    } catch (error) {
      console.error("Error getting location:", error); // If current location cannot be retrieved
      Alert.alert(
        "Unable to get your location. Please enable location services."
      );
    }
  };

  useEffect(() => {
    traceRoute();
  }, [transportMode]);

  // const setWalking = () => {
  //   setTransportMode("WALKING");
  // };

  // const setDriving = () => {
  //   setTransportMode("DRIVING");
  // };

  // const setTransit = () => {
  //   setTransportMode("TRANSIT");
  // };

  useEffect(() => {
    if (destination) {
      // automatic refresh to counteract rendering bugs by deleting this and saving
      // and then pasting it back in
      console.log("Refreshed app");
    }
  }, [destination]);

  useEffect(() => {
    if (directionsRoute) {
      console.log("Beginning Direction Rendering"); // proof that state changed and rendering should begin, if not it is an API or rendering issue
    }
  }, [directionsRoute]);

  const handleFloorplanPress = (event: any) => {
    if(indoorPaths1)
    {
      if(selectedIndoorPathIndex1+1 >= indoorPaths1.length)
      {
        setSelectedIndoorPathIndex1(0);
      }
      else
      {
        setSelectedIndoorPathIndex1(selectedIndoorPathIndex1+1);
      }
    }
  };

  return (
    <View style={DirectionsScreenStyles.container}>
      <MapView
        ref={mapRef}
        style={DirectionsScreenStyles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={SGW_CAMPUS}
        showsBuildings={false}
      >
        {origin && (
          <Marker
            coordinate={origin}
            pinColor="green" // Green for origin
          >
            <Callout>
              <View style={DirectionsScreenStyles.calloutContainer}>
                <Text style={DirectionsScreenStyles.calloutText}>Start</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {destination && (
          <Marker
            coordinate={destination}
            pinColor="red" // Red for destination
          >
            <Callout>
              <View style={DirectionsScreenStyles.calloutContainer}>
                <Text style={DirectionsScreenStyles.calloutText}>
                  Destination
                </Text>
              </View>
            </Callout>
          </Marker>
        )}

{indoorPaths1 && 
indoorPaths1.length > 0 && 
selectedIndoorPathIndex1 < indoorPaths1.length && (
  <Geojson
  geojson={
    getBuilding(indoorPaths1[selectedIndoorPathIndex1].buildingName)
    .floors[indoorPaths1[selectedIndoorPathIndex1].floorName]
    .plan
  }
  strokeColor="#0085cc"
  fillColor="#29b4ff"
  strokeWidth={2}
  onPress={handleFloorplanPress}
  tappable={true}
/>
)}

 {indoorPaths1 && 
 indoorPaths1.length > 0 &&
 selectedIndoorPathIndex1 < indoorPaths1.length && (
        <Polyline
          coordinates={indoorPaths1[selectedIndoorPathIndex1].path}
          strokeColor={'#fcc600'}
          strokeWidth={4}
          zIndex={100}>
        </Polyline>
        )}

        {directionsRoute && origin && destination && (
          <MapViewDirections
            key={`${origin?.latitude}-${origin?.longitude}-${destination?.latitude}-${destination?.longitude}`}
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeColor="#6644ff"
            strokeWidth={4}
            mode={transportMode}
            onReady={(args) => {
              setDistance(args.distance);
              setDuration(args.duration);
            }}
          />
        )}
      </MapView>

      <View
        style={{
          position: "absolute",
          top: 12,
          left: 20,
          right: 20,
          zIndex: 5,
        }}
      >
        {/* "From" Input */}
        <View
          style={[
            DirectionsScreenStyles.inputContainer,
            { flexDirection: "row", alignItems: "center" },
          ]}
        >
          <FontAwesome5
            name="map-marker-alt"
            size={16}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <GooglePlacesAutocomplete
            placeholder="From"
            fetchDetails
            onPress={(data, details) =>
              details && handleLocationSelect(details, setOrigin, "origin")
            }
            query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
            styles={{
              container: DirectionsScreenStyles.autoCompleteContainer,
              textInput: DirectionsScreenStyles.roundedInput,
            }}
          />
        </View>

        {/* "To" Input */}
        <View
          style={[
            DirectionsScreenStyles.inputContainer,
            { flexDirection: "row", alignItems: "center" },
          ]}
        >
          <FontAwesome5
            name="map-pin"
            size={16}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <GooglePlacesAutocomplete
            placeholder={"Destination"} // Placeholder restored
            fetchDetails
            onPress={(data, details) =>
              details &&
              handleLocationSelect(
                details,
                setDestination,
                "destination",
                destinationObject
              )
            }
            query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
            styles={{
              container: DirectionsScreenStyles.autoCompleteContainer,
              textInput: DirectionsScreenStyles.roundedInput,
            }}
          />
        </View>

        {/* Transport Mode Buttons */}
        <View
          style={[
            DirectionsScreenStyles.transportModeContainer,
            { marginBottom: 5 },
          ]}
        >
          {[
            { mode: "ROUTE", icon: "route" },
            { mode: "WALKING", icon: "walking" },
            { mode: "DRIVING", icon: "car" },
            { mode: "TRANSIT", icon: "bus" },
            { mode: "SHUTTLE", icon: "shuttle-van" },
          ].map(({ mode, icon }) => (
            <TouchableOpacity
              key={mode}
              onPress={async () => {
                if (mode === "SHUTTLE") {
                  await setShuttleRoute();
                  setShowShuttleTime(true);
                } else {
                  setTransportMode(mode);
                  setShowShuttleTime(false);
                }
              }}
              style={{ alignItems: "center" }}
              testID={mode}
            >
              <FontAwesome5
                name={icon}
                size={22}
                color={transportMode === mode ? "#6644ff" : "black"}
              />
              {transportMode === mode && (
                <View
                  style={{
                    width: 22,
                    height: 2,
                    backgroundColor: "#6644ff",
                    marginTop: 4,
                    borderRadius: 2,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Distance & Duration Stats */}
      {distance > 0 && duration > 0 && (
        <View style={DirectionsScreenStyles.statsContainer}>
          <Text style={DirectionsScreenStyles.statsText}>
            Distance: {distance.toFixed(2)} km
          </Text>
          <Text style={DirectionsScreenStyles.statsText}>
            Duration: {Math.ceil(duration)} min
          </Text>
          {showShuttleTime && (
            <Text style={DirectionsScreenStyles.statsText}>
              {findNextShuttle(shuttleValid)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
