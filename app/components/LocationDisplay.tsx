import React from 'react';
import { Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

type LocationDisplayProps = {
  location: Location.LocationObject | null;
  errorMsg: string | null;
};

export default function LocationDisplay({ location, errorMsg }: LocationDisplayProps) {
  let locationText = 'Waiting for location...';
  if (errorMsg) {
    locationText = errorMsg;
  } else if (location) {
    locationText = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`;
  }

  return <Text style={styles.locationText}>{locationText}</Text>;
}

const styles = StyleSheet.create({
  locationText: {
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
    color: 'gray',
  },
});