import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Platform, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { pick, types } from '@react-native-documents/picker';
import DatePicker from 'react-native-date-picker';
import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_URL } from "@env"


export default function Home() {
    const [itemStatus, setItemStatus] = useState('lost');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [openDate, setOpenDate] = useState(false)
    const [openTime, setOpenTime] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    const validateForm = () => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return false;
        }
        if (!location.trim()) {
            Alert.alert('Error', 'Please enter a location');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return false;
        }
        if (itemStatus === 'found' && !selectedImage) {
            Alert.alert('Error', 'Please select an image');
            return false;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = null;

            if (selectedImage) {
                const data = new FormData();
                data.append('file', {
                    uri: selectedImage.uri,
                    type: selectedImage.type,
                    name: selectedImage.name,
                });
                data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                data.append('cloud_name', CLOUDINARY_CLOUD_NAME);

                const res = await fetch(CLOUDINARY_URL, {
                    method: 'POST',
                    body: data,
                });

                const json = await res.json();
                uploadedImageUrl = json.secure_url;
                console.log('Uploaded image URL:', uploadedImageUrl);
            }

            const itemData = {
                description: description.trim(),
                location: location.trim(),
                contact: email.trim(),
                image: uploadedImageUrl,
                ...(itemStatus === 'lost' && {
                    dateLost: date.toISOString(),
                    timeLost: time.toLocaleTimeString()
                })
            };
            console.log('Submitting item:', itemData);

            if (itemStatus === 'lost') {
                const firestoreResponse = await firestore().collection("lostItems").add(itemData)
                console.log(firestoreResponse)
            }
            else {
                const firestoreResponse = await firestore().collection("foundItems").add(itemData)
                console.log(firestoreResponse)
            }

            Alert.alert(
                'Success',
                `Item ${itemStatus === 'lost' ? 'lost' : 'found'} report submitted successfully!`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setDescription('');
                            setLocation('');
                            setEmail('');
                            setSelectedImage(null);
                            setDate(new Date());
                            setTime(new Date());
                        }
                    }
                ]
            );
        }
        catch (error) {
            Alert.alert('Error', 'Failed to submit report. Please try again.');
            console.error('Submit error:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const handleImagePick = async () => {
        try {
            const result = await pick({
                type: [types.images],
            });
            setSelectedImage(result[0]);
        } catch (err) {
            console.log('Error picking document:', err);
        }
    };

    // Update the date handler
    const handleDateConfirm = (selectedDate) => {
        setOpenDate(false)
        setDate(selectedDate)
    }

    // Update the time handler
    const handleTimeConfirm = (selectedTime) => {
        setOpenTime(false)
        setTime(selectedTime)
    }

    // Function to validate description
    const handleDescriptionChange = (text) => {
        // Allow only letters, numbers, spaces and basic punctuation
        const filtered = text.replace(/[^\w\s.,!?-]/g, '');
        setDescription(filtered);
    };

    const handleEmailChange = (text) => {
        setEmail(text.trim());
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.heading}>FindIt</Text>
                <Text style={styles.subHeading}>Helping you reconnect with your lost or found items easily.</Text>
            </View>

            <Text style={styles.info}>Sumbit your lost / found item report</Text>

            {/* Form */}
            <View style={styles.formContainer}>
                <View style={styles.toggleContainer}>
                    <Pressable
                        android_ripple={{ color: "#ddd" }}
                        style={[styles.toggleButton, itemStatus === 'lost' && styles.activeButton]}
                        onPress={() => setItemStatus('lost')}
                    >
                        <View style={styles.toggleButtonContent}>
                            <Text style={[styles.toggleIcon, itemStatus === 'lost' && styles.activeIcon]}>🔍</Text>
                            <Text style={[styles.toggleButtonText, itemStatus === 'lost' && styles.activeButtonText]}>
                                Lost Item
                            </Text>
                        </View>
                    </Pressable>

                    <Pressable
                        android_ripple={{ color: "#ddd" }}
                        style={[styles.toggleButton, itemStatus === 'found' && styles.activeButton]}
                        onPress={() => setItemStatus('found')}
                    >
                        <View style={styles.toggleButtonContent}>
                            <Text style={[styles.toggleIcon, itemStatus === 'found' && styles.activeIcon]}>✨</Text>
                            <Text style={[styles.toggleButtonText, itemStatus === 'found' && styles.activeButtonText]}>
                                Found Item
                            </Text>
                        </View>
                    </Pressable>
                </View>
                <View style={styles.formSection}>
                    <Text style={styles.label}>
                        <Text style={styles.labelIcon}>📝</Text> Description
                    </Text>
                    <TextInput
                        placeholderTextColor={'#999'}
                        placeholder="Short description (letters, numbers and basic punctuation only)"
                        style={[styles.input, styles.descriptionInput]}
                        value={description}
                        onChangeText={handleDescriptionChange}
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                    />
                    <Text style={styles.charCount}>{description.length}/200</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>
                        <Text style={styles.labelIcon}>📍</Text> Location
                    </Text>
                    <TextInput
                        placeholderTextColor={'#999'}
                        placeholder={itemStatus === 'found' ? "Where is the item now?" : "Room no / Area last seen"}
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>
                        <Text style={styles.labelIcon}>📧</Text> Contact Information
                    </Text>
                    <TextInput
                        placeholderTextColor={'#999'}
                        placeholder="Enter your email address / mobile number"
                        style={styles.input}
                        value={email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                </View>

                {/* Update the image picker section */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>
                        <Text style={styles.labelIcon}>📸</Text> Item Image
                    </Text>
                    <Pressable
                        android_ripple={{ color: "#ddd" }}
                        style={[styles.imagePicker, selectedImage && styles.imagePickerWithImage]}
                        onPress={handleImagePick}
                    >
                        {selectedImage ? (
                            <View style={styles.selectedImageContainer}>
                                <Image
                                    source={{ uri: selectedImage.uri }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                                <Pressable
                                    style={styles.removeButton}
                                    onPress={() => setSelectedImage(null)}
                                >
                                    <Text style={styles.removeButtonText}>×</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Text style={styles.uploadIcon}>📤</Text>
                                <Text style={styles.imagePickerText}>Tap to upload an image</Text>
                                <Text style={styles.imagePickerSubText}>(optional)</Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {itemStatus === 'lost' && (
                    <View style={styles.formSection}>
                        <Text style={styles.label}>
                            <Text style={styles.labelIcon}>🕒</Text> When was it lost?
                        </Text>
                        <Pressable
                            style={styles.dateTimeButton}
                            onPress={() => setOpenDate(true)}
                        >
                            <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
                            <Text style={styles.dateTimeIcon}>📅</Text>
                        </Pressable>

                        <Pressable
                            style={styles.dateTimeButton}
                            onPress={() => setOpenTime(true)}
                        >
                            <Text style={styles.dateTimeText}>
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text style={styles.dateTimeIcon}>⏰</Text>
                        </Pressable>

                        <DatePicker
                            modal
                            open={openDate}
                            date={date}
                            mode="date"
                            maximumDate={new Date()}
                            onConfirm={handleDateConfirm}
                            onCancel={() => setOpenDate(false)}
                        />

                        <DatePicker
                            modal
                            open={openTime}
                            date={time}
                            mode="time"
                            onConfirm={handleTimeConfirm}
                            onCancel={() => setOpenTime(false)}
                        />
                    </View>
                )}

                <Pressable
                    android_ripple={{ color: "#1a572f" }}
                    style={[
                        styles.submitButton,
                        isSubmitting && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <View style={styles.submitButtonContent}>
                        {isSubmitting ? (
                            <ActivityIndicator size={24} color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Report Item</Text>
                                <Text style={styles.submitButtonIcon}>📢</Text>
                            </>
                        )}
                    </View>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        paddingBottom: 400,
    },
    headerContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
    },
    heading: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a73e8',
        marginBottom: 8,
        textAlign: 'center',
    },
    subHeading: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
        lineHeight: 22,
    },
    info: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 10,
        textAlign: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        gap: 5,
        marginBottom: 25
    },
    toggleButton: {
        flex: 0.48,
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    toggleButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleIcon: {
        fontSize: 20,
        marginRight: 8,
        opacity: 0.7,
    },
    activeIcon: {
        opacity: 1,
    },
    toggleButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    activeButton: {
        backgroundColor: '#1a73e8',
        borderColor: '#1a73e8',
        transform: [{ scale: 1.02 }],
    },
    activeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginTop: 20,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    formSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelIcon: {
        marginRight: 8,
        fontSize: 18,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#2c3e50',
    },
    descriptionInput: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    charCount: {
        textAlign: 'right',
        color: '#999',
        fontSize: 12,
        marginTop: 4,
    },
    imagePicker: {
        backgroundColor: '#f8f9fa',
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    selectedImageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    imagePickerWithImage: {
        borderStyle: 'solid',
        borderColor: '#1a73e8',
    },
    uploadPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    imagePickerText: {
        color: '#666',
        fontSize: 16,
        marginBottom: 4,
    },
    imagePickerSubText: {
        color: '#999',
        fontSize: 14,
    },
    dateTimeButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    dateTimeText: {
        fontSize: 16,
        color: '#2c3e50',
    },
    dateTimeIcon: {
        fontSize: 20,
    },
    submitButton: {
        backgroundColor: '#1a73e8',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
        elevation: 2,
    },
    submitButtonContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    submitButtonIcon: {
        fontSize: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#90caf9',
    },
    removeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(244, 67, 54, 0.9)',
        borderRadius: 12,
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
