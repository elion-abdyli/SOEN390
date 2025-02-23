import React from 'react';
import { Marker } from 'react-native-maps';

type MapMarkerProps = {
  coordinate: { latitude: number; longitude: number };
  title: string;
};

const MapMarker: React.FC<MapMarkerProps> = ({ coordinate, title }) => {
  // Check title to assign specific testID and accessibilityLabel
  const testID = title.replace(/\s+/g, '') + 'Marker'; // Example: "VA Building" -> "VABuildingMarker"
  const accessibilityLabel = `${title} Marker`;

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

export default MapMarker;
