import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';


export default function LostItemsScreen() {
    const [lostItems, setLostItems] = useState([])
    const [isFetching, setIsFetching] = useState(true)

    useFocusEffect(
        useCallback(() => {
            async function fetchLostItems() {
                try {
                    const response = await firestore().collection('lostItems').get();
                    const items = response.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    console.log(items);
                    setLostItems(items);
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


    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.heading}>Lost Items</Text>
            </View>

            {isFetching && <ActivityIndicator size={50} style={{marginTop: 30}} />}

            <ScrollView style={styles.scrollView}>
                {lostItems.map(item => (
                    <View key={item.id} style={styles.card}>
                        {item.image && (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                        <View style={styles.details}>
                            <Text style={styles.description}>{item.description}</Text>
                            <Text style={styles.info}>
                                <Text style={styles.label}>Location: </Text>
                                {item.location}
                            </Text>
                            <Text style={styles.info}>
                                <Text style={styles.label}>Lost on: </Text>
                                {new Date(item.dateLost).toLocaleDateString()} at {item.timeLost}
                            </Text>
                            <Text style={styles.info}>
                                <Text style={styles.label}>Contact: </Text>
                                {item.contact || 'No contact provided'}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    )
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
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    noImageContainer: {
        height: 150, // Smaller height for no image container
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#999',
        fontSize: 16,
        fontStyle: 'italic',
    },
    imageContainer: {
        height: 233,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    details: {
        padding: 16,
    },
    description: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    info: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    label: {
        fontWeight: '600',
        color: '#444',
    },
});