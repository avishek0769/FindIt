import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Tabs from './src/TabNavigator';
import { StatusBar } from 'react-native';

export default function App() {

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={"white"} showHideTransition={'slide'} barStyle={'dark-content'} />
      <Tabs />
    </NavigationContainer>
  );
}