import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, Pressable, Linking } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

const DUMMY_LOST_ITEMS = [
    {
        id: '1',
        description: 'MacBook Pro 13" (2020) with stickers',
        location: 'Library Reading Room, 2nd Floor',
        dateLost: '2024-04-28',
        timeLost: '14:30',
        image: 'https://images.pexels.com/photos/303383/pexels-photo-303383.jpeg',
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        number: '9876543210',
        course: 'B.Tech Computer Science',
        year: '3',
        isFound: false
    },
    {
        id: '2',
        description: 'Blue Nike backpack with calculus textbook',
        location: 'Cafeteria',
        dateLost: '2024-04-27',
        timeLost: '12:15',
        image: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg',
        fullname: 'Sarah Wilson',
        email: 'sarah.w@example.com',
        number: '9876543211',
        course: 'BSc Mathematics',
        year: '2',
        isFound: true
    },
    {
        id: '3',
        description: 'Black wallet with student ID',
        location: 'Basketball Court',
        dateLost: '2024-04-29',
        timeLost: '16:45',
        image: null,
        fullname: 'Mike Johnson',
        email: 'mike.j@example.com',
        number: '9876543212',
        course: 'BBA',
        year: '1',
        isFound: false
    },
    {
        id: '4',
        description: 'Samsung Galaxy S23 with red case',
        location: 'Physics Lab',
        dateLost: '2024-04-26',
        timeLost: '11:20',
        image: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg',
        fullname: 'Emily Brown',
        email: 'emily.b@example.com',
        number: '9876543213',
        course: 'BSc Physics',
        year: '4',
        isFound: false
    },
    {
        id: '5',
        description: 'Gold-plated prescription glasses',
        location: 'Auditorium',
        dateLost: '2024-04-25',
        timeLost: '15:00',
        image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg',
        fullname: 'David Clark',
        email: 'david.c@example.com',
        number: '9876543214',
        course: 'BA Literature',
        year: '2',
        isFound: true
    }
];

export default function LostItemsScreen() {
    const [lostItems, setLostItems] = useState([])
    const [isFetching, setIsFetching] = useState(true)
    const [expandedItems, setExpandedItems] = useState({});

    useFocusEffect(
        useCallback(() => {
            async function fetchLostItems() {
                try {
                    // const response = await firestore().collection('lostItems').get();
                    // const items = response.docs.map(doc => ({
                    //     id: doc.id,
                    //     ...doc.data(),
                    // }));
                    // console.log(items);
                    setLostItems(DUMMY_LOST_ITEMS);
                }
                catch (error) {
                    console.log('Error fetching lost items: ', error);
                }
                finally {
                    setIsFetching(false);
                }
            }

            fetchLostItems();
        }, [])
    );

    const toggleExpand = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleCall = (number) => {
        Linking.openURL(`tel:${number}`);
    };

    const handleEmail = (email) => {
        Linking.openURL(`mailto:${email}`);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.heading}>Lost Items</Text>
            </View>

            {isFetching && <ActivityIndicator size={50} style={{ marginTop: 30 }} />}

            <ScrollView style={styles.scrollView}>
                {lostItems.map(item => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            {item.image && (
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: item.image }}
                                        style={styles.image}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                            <View style={[
                                styles.statusBadge, 
                                { 
                                    backgroundColor: item.isFound ? '#d8f3dc' : '#ffccd5',
                                    position: item.image ? 'absolute' : 'relative',
                                    top: item.image ? 7 : 0,
                                    right: item.image ? 7 : null,
                                    left: item.image ? undefined : "68%",
                                }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    item.isFound ? styles.statusFound : styles.statusLost
                                ]}>
                                    {item.isFound ? 'Found' : 'Not Found'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.details}>
                            <Pressable
                                onPress={() => toggleExpand(item.id)}
                                style={styles.headerRow}
                            >
                                <Text style={styles.description}>{item.description}</Text>
                                <Text style={styles.expandIcon}>
                                    {expandedItems[item.id] ? '▼' : '▶'}
                                </Text>
                            </Pressable>

                            {expandedItems[item.id] && (
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Item Details</Text>
                                        <Text style={styles.info}>
                                            <Text style={styles.label}>📍 Location: </Text>
                                            {item.location}
                                        </Text>
                                        <Text style={styles.info}>
                                            <Text style={styles.label}>🕒 Lost on: </Text>
                                            {new Date(item.dateLost).toLocaleDateString()} at {item.timeLost}
                                        </Text>
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.sectionTitle}>Contact Information</Text>
                                        <Text style={styles.info}>
                                            <Text style={styles.label}>👤 Name: </Text>
                                            {item.fullname}
                                        </Text>
                                        <Pressable onPress={() => handleCall(item.number)}>
                                            <Text style={[styles.info, styles.clickable]}>
                                                <Text style={styles.label}>📱 Phone: </Text>
                                                {item.number}
                                            </Text>
                                        </Pressable>
                                        <Pressable onPress={() => handleEmail(item.email)}>
                                            <Text style={[styles.info, styles.clickable]}>
                                                <Text style={styles.label}>✉️ Email: </Text>
                                                {item.email}
                                            </Text>
                                        </Pressable>
                                    </View>

                                    {item.course && (
                                        <View style={styles.infoSection}>
                                            <Text style={styles.sectionTitle}>Student Details</Text>
                                            <Text style={styles.info}>
                                                <Text style={styles.label}>📚 Course: </Text>
                                                {item.course}
                                            </Text>
                                            <Text style={styles.info}>
                                                <Text style={styles.label}>🎓 Year: </Text>
                                                {item.year}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerContainer: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        overflow: 'hidden',
        position: 'relative',
    },
    cardHeader: {
        position: 'relative',
        width: '100%',
    },
    statusBadge: {
        zIndex: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        margin: 7,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusFound: {
        color: '#4CAF50',
    },
    statusLost: {
        color: 'red',
    },
    imageContainer: {
        height: 200,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    details: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    description: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginRight: 8,
    },
    expandIcon: {
        fontSize: 18,
        color: '#666',
        paddingHorizontal: 8,
    },
    infoGrid: {
        gap: 16,
        marginTop: 12,
    },
    infoSection: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a73e8',
        marginBottom: 8,
    },
    info: {
        fontSize: 15,
        color: '#444',
        marginBottom: 6,
        lineHeight: 22,
    },
    label: {
        fontWeight: '600',
        color: '#2c3e50',
    },
    clickable: {
        color: '#1a73e8',
    },
    noImageContainer: {
        height: 150,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#999',
        fontSize: 16,
        fontStyle: 'italic',
    },
});