// styles/AutocompleteSearchStyles.ts
import { StyleSheet } from 'react-native';
import { DefaultMapStyle } from '@/Styles/MapStyles';
import { ButtonsStyles as BaseButtonStyles } from '@/Styles/ButtonStyles'; // Import ButtonStyles

export const AutocompleteSearchStyles = StyleSheet.create({
  searchWrapper: BaseButtonStyles.searchWrapper, // Reuse existing wrapper style
  autocompleteContainer: {
    flex: 0,
    width: '100%',
    zIndex: 9999,
  },
  textInput: {
    ...DefaultMapStyle.searchBox,
    height: 44,
  },
  listView: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 5,
  },
  row: {
    padding: 13,
    height: 'auto',
    backgroundColor: 'white',
  },
  separator: {
    height: 1,
    backgroundColor: '#c8c7cc',
  },
  description: {
    fontSize: 15,
  },
  predefinedPlacesDescription: {
    color: '#1faadb',
  },
  buttonsContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  searchButton: {
    marginRight: 5,
    flex: 1,
  },
  clearButton: {
    backgroundColor: "red",
    flex: 1,
  },
});