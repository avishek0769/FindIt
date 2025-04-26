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

            if(itemStatus === 'lost') {
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
            <Text style={styles.heading}>FindIt</Text>
            <Text style={styles.subHeading}>Helping you reconnect with your lost or found items easily.</Text>

            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
                <Pressable android_ripple={{ color: "#ddd" }}
                    style={[styles.toggleButton, itemStatus === 'lost' && styles.activeButton]}
                    onPress={() => setItemStatus('lost')}
                >
                    <Text style={itemStatus === 'lost' ? styles.activeButtonText : styles.toggleButtonText}>
                        Item Lost
                    </Text>
                </Pressable>

                <Pressable android_ripple={{ color: "#ddd" }}
                    style={[styles.toggleButton, itemStatus === 'found' && styles.activeButton]}
                    onPress={() => setItemStatus('found')}
                >
                    <Text style={itemStatus === 'found' ? styles.activeButtonText : styles.toggleButtonText}>
                        Item Found
                    </Text>
                </Pressable>
            </View>

            {/* Form */}
            <View style={styles.form}>
                <Text style={styles.label}>Description</Text>
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

                <Text style={styles.label}>Location</Text>
                <TextInput
                    placeholderTextColor={'#999'}
                    placeholder={itemStatus === 'found' ? "Where is the item now?" : "Room no / Area last seen"}
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                />

                <Text style={styles.label}>Email Address / Mobile number</Text>
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

                <Text style={styles.label}>Item Image</Text>
                <Pressable android_ripple={{ color: "#ddd" }} style={styles.imagePicker} onPress={handleImagePick}>
                    {selectedImage ? (
                        <View style={styles.selectedImageContainer}>
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Text style={styles.removeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.imagePickerText}>Upload an Image (optional)</Text>
                    )}
                </Pressable>

                {itemStatus === 'lost' && (
                    <>
                        <Text style={styles.label}>Date Lost</Text>
                        <Pressable
                            style={styles.dateTimeButton}
                            onPress={() => setOpenDate(true)}
                        >
                            <Text>{date.toLocaleDateString()}</Text>
                        </Pressable>

                        <Text style={styles.label}>Time Lost</Text>
                        <Pressable
                            style={styles.dateTimeButton}
                            onPress={() => setOpenTime(true)}
                        >
                            <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
                    </>
                )}

                {/* Submit Button */}
                <Pressable
                    android_ripple={{ color: "#ddd" }}
                    style={[
                        styles.submitButton,
                        isSubmitting && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ?
                        <ActivityIndicator size={23} color={"white"} /> :
                        <Text style={styles.submitButtonText}>
                            Report Item
                        </Text>
                    }
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
        paddingBottom: 400
    },
    heading: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 10,
        color: '#333',
    },
    subHeading: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#eee',
        borderRadius: 20,
        marginHorizontal: 10,
    },
    activeButton: {
        backgroundColor: '#007bff',
    },
    toggleButtonText: {
        fontSize: 16,
        color: '#555',
    },
    activeButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    form: {
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    descriptionInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    imagePicker: {
        backgroundColor: '#f0f0f0',
        height: 150,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    imagePickerText: {
        color: '#999',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 40
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 4,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    dateTimeButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedImageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 68, 68, 0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 24,
    },
    submitButtonDisabled: {
        backgroundColor: '#93c5a2',
    },
});
