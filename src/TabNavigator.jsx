// Tabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Home from './screens/Home';
import LostItemsScreen from './screens/LostItemsScreen';
import About from './screens/About';

const Tab = createBottomTabNavigator();

export default function Tabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = 'home';
                            break;
                        case 'Lost Items':
                            iconName = 'cancel';
                            break;
                        case 'About':
                            iconName = 'info';
                            break;
                    }

                    return <Icon name={iconName} size={28} color={color} />;
                },
                tabBarActiveTintColor: "#000",
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: {
                    fontSize: 14,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                },
                tabBarStyle: {
                    height: 58
                }
            })}
        >
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Lost Items" component={LostItemsScreen} />
            <Tab.Screen name="About" component={About} />
        </Tab.Navigator>
    );
}