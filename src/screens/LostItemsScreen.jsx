import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator, Pressable, Linking, TextInput, Modal } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import '@react-native-firebase/app';
import firestore, { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, updateDoc } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import ModalPopup from '../components/ModalPopUp';

const db = getFirestore(getApp())

const VerificationPopup = ({ visible, onClose, onVerify, code, setCode }) => {
    const [verificationLoading, setVerificationLoading] = useState(false);

    useEffect(() => {
        setVerificationLoading(false)
    }, [visible])

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Verify Item Found</Text>

                    <Text style={styles.modalDescription}>
                        Please enter the verification code provided by the item owner.
                        This helps us ensure that items are returned to their rightful owners.
                    </Text>

                    <TextInput
                        style={styles.verificationInput}
                        placeholder="Enter verification code"
                        value={code}
                        keyboardType='number-pad'
                        onChangeText={setCode}
                        autoCapitalize="characters"
                        maxLength={6}
                    />

                    <View style={styles.modalButtons}>
                        <Pressable
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            disabled={verificationLoading}
                            style={[styles.modalButton, styles.verifyButton]}
                            onPress={() => onVerify(code)}
                        >
                            {verificationLoading ? <ActivityIndicator color={"#fff"} /> : <Text style={styles.verifyButtonText}>Verify</Text>}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function LostItemsScreen() {
    const [lostItems, setLostItems] = useState([])
    const [isFetching, setIsFetching] = useState(true)
    const [expandedItems, setExpandedItems] = useState({});
    const [isVerificationVisible, setIsVerificationVisible] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        type: 'success',
        title: '',
        message: ''
    });

    const handleMarkFound = (itemId) => {
        setSelectedItemId(itemId);
        setIsVerificationVisible(true);
    };

    const handleVerification = async (code) => {
        try {
            const docRef = doc(db, "lostItems", selectedItemId)
            const selectedDoc = await getDoc(docRef)
            console.log("Selected Doc", selectedDoc)
            console.log(selectedDoc._data.verificationCode, Number(code))

            if (selectedDoc._data.verificationCode == Number(code)) {
                await updateDoc(docRef, { isFound: true })

                const updatedItems = lostItems.map(item =>
                    item.id === selectedItemId ? { ...item, isFound: true } : item
                )
                setLostItems(updatedItems);
                // Success popup
                setModalConfig({
                    type: "success",
                    title: "Verified",
                    message: "Item successfully verified as found",
                })
                setModalVisible(true)
            }
            else {
                setIsVerificationVisible(false);
                setTimeout(() => {
                    setModalConfig({
                        type: "error",
                        title: "Error",
                        message: "Verification code is incorrect"
                    })
                    setModalVisible(true)
                }, 100);
            }
        }
        catch (error) {
            setIsVerificationVisible(false);
            setTimeout(() => {
                setModalConfig({
                    type: "error",
                    title: "Error",
                    message: error.message
                })
                setModalVisible(true)
            }, 100);
        }
        finally {
            // Close the popup
            setIsVerificationVisible(false);
            setSelectedItemId(null);
            setVerificationCode('');
        }
    };

    useFocusEffect(
        useCallback(() => {
            async function fetchLostItems() {
                try {
                    const collectionRef = collection(db, "lostItems")
                    const q = query(collectionRef, orderBy("isFound"))
                    const querySnapshot = await getDocs(q)

                    const items = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setLostItems(items);
                }
                catch (error) {
                    setModalConfig({
                        type: "error",
                        title: "Error",
                        message: "Error occured, check internet connection"
                    })
                    setModalVisible(true)
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

            {isFetching && <View style={{height: "90%", justifyContent: "center"}}>
                <ActivityIndicator size={50} style={{ marginTop: 30 }} color={"#1a73e8"} />
            </View> }

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
                                    top: item.image ? 1 : 0,
                                    right: item.image ? 1 : null,
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
                            {!item.isFound && (
                                <Pressable
                                    style={styles.markFoundButton}
                                    onPress={() => handleMarkFound(item.id)}
                                >
                                    <Text style={styles.markFoundButtonText}>Mark as Found</Text>
                                    <Text style={styles.markFoundIcon}>✓</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Add the VerificationPopup component at the bottom of your return statement */}
                        <VerificationPopup
                            visible={isVerificationVisible}
                            onClose={() => setIsVerificationVisible(false)}
                            onVerify={handleVerification}
                            code={verificationCode}
                            setCode={setVerificationCode}
                        />


                    </View>
                ))}
            </ScrollView>

            <ModalPopup
                visible={modalVisible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={() => setModalVisible(false)}
            />
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
    markFoundButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        elevation: 2,
    },
    markFoundButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    markFoundIcon: {
        color: '#fff',
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    verificationInput: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    verifyButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});