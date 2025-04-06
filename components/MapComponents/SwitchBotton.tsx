import { styles } from '@/Styles/SwitchBottonStyles';
import { SwitchButtonsProps } from '@/types/MapComponentTypes';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';


const SwitchButtons: React.FC<SwitchButtonsProps> = ({ onSwitchToSGW, onSwitchToLoyola }) => {
  return (
    <View style={styles.buttonContainer}>
      <Button mode="contained" onPress={onSwitchToSGW} style={styles.button}>
        Switch to SGW
      </Button>
      <Button mode="contained" onPress={onSwitchToLoyola} style={styles.button}>
        Switch to Loyola
      </Button>
    </View>
  );
};

export default SwitchButtons;