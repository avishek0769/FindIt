import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Platform, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { pick, types } from '@react-native-documents/picker';
import DatePicker from 'react-native-date-picker';
import '@react-native-firebase/app';
import firestore, { addDoc, collection, getFirestore } from '@react-native-firebase/firestore';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_URL } from "@env"
import { Picker } from '@react-native-picker/picker';
import ModalPopup from '../components/ModalPopUp';
import { getApp } from '@react-native-firebase/app';

const db = getFirestore(getApp())

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
    const [fullname, setFullname] = useState('');
    const [number, setNumber] = useState('');
    const [course, setCourse] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        type: 'success',
        title: '',
        message: ''
    });

    const validateForm = () => {
        if (!description.trim()) {
            setModalConfig({
                type: 'error',
                title: 'Missing Description',
                message: 'Please enter a description of the item'
            });
            setModalVisible(true);
            return false;
        }
        if (!location.trim()) {
            setModalConfig({
                type: 'error',
                title: 'Missing Location',
                message: 'Please enter where the item was lost/found'
            });
            setModalVisible(true);
            return false;
        }
        if (!email.trim()) {
            setModalConfig({
                type: 'error',
                title: 'Missing Email',
                message: 'Please enter your email address for contact'
            });
            setModalVisible(true);
            return false;
        }
        if (itemStatus === 'found' && !selectedImage) {
            setModalConfig({
                type: 'error',
                title: 'Image Required',
                message: 'Please upload an image of the found item'
            });
            setModalVisible(true);
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setModalConfig({
                type: 'error',
                title: 'Invalid Email',
                message: 'Please enter a valid email address'
            });
            setModalVisible(true);
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = null;
            let verificationCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

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
                fullname: fullname.trim(),
                description: description.trim(),
                location: location.trim(),
                image: uploadedImageUrl,
                email: email.trim(),
                number: number.trim(),
                isFound: false,
                verificationCode,

                ...(itemStatus === 'lost' && {
                    course: course?.trim() || null,
                    year: selectedYear.length > 0 ? selectedYear : null,
                    dateLost: date.toISOString(),
                    timeLost: time.toLocaleTimeString()
                })
            };
            console.log('Submitting item:', itemData);

            if (itemStatus === 'lost') {
                const collectionRef = collection(db, "lostItems")
                const firebaseResponse = await addDoc(collectionRef, itemData)

                if (firebaseResponse && firebaseResponse.id) {
                    // Send Verification code
                    const res = await fetch("https://z1v3k1h4-3000.inc1.devtunnels.ms/send-email", {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: email,
                            code: verificationCode
                        })
                    })
                    // console.log(await res.text())
                    const resendResponse = await res.json()
                    console.log(resendResponse)

                    if (resendResponse.messageId) {
                        setModalConfig({
                            type: 'success',
                            title: 'Success!',
                            message: `Item ${itemStatus === 'lost' ? 'lost' : 'found'} report submitted successfully!`
                        });
                        setModalVisible(true);
                        setSelectedImage(null);
                        setDescription('');
                        setLocation('');
                        setDate(new Date());
                        setTime(new Date());
                        setEmail('');
                        setFullname('');
                        setNumber('');
                        setCourse('');
                        setSelectedYear('');
                        setItemStatus('lost');
                    }
                    else {
                        setModalConfig({
                            type: 'warning',
                            title: 'Warning',
                            message: "Report submitted, but an error occured while sending the email"
                        });
                        setModalVisible(true);
                    }
                }
            }
            else {
                // const firebaseResponse = await firestore().collection("foundItems").add(itemData)
            }
        }
        catch (error) {
            console.error(error)
            setModalConfig({
                type: 'error',
                title: 'Error',
                message: "Failed to submit report. Check internet connection"
            });
            setModalVisible(true);
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

            <Text style={styles.info}>Sumbit your lost item report</Text>

            {/* Form */}
            <View style={styles.formContainer}>
                {/* <View style={styles.toggleContainer}>
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
                </View> */}

                {/* The image picker section */}
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
                                <Text style={styles.imagePickerText}>Tap to upload an image (optional)</Text>
                                {itemStatus == "lost" && <Text style={styles.imagePickerSubText}>Try to give a landscape image</Text>}
                            </View>
                        )}
                    </Pressable>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>
                        <Text style={styles.labelIcon}>📝</Text> Description
                    </Text>
                    <TextInput
                        placeholderTextColor={'#999'}
                        placeholder="Short description of the item"
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
                        <Text style={styles.labelIcon}>👤</Text> Full name
                    </Text>
                    <TextInput
                        placeholderTextColor={'#999'}
                        placeholder="Enter your full name"
                        style={styles.input}
                        value={fullname}
                        onChangeText={setFullname}
                        keyboardType="name-phone-pad"
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>
                        <Text style={styles.labelIcon}>✉️</Text> Email address
                    </Text>
                    <TextInput
                        placeholderTextColor={'#999'}
                        placeholder="Enter your email address"
                        style={styles.input}
                        value={email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.label}>
                        <Text style={styles.labelIcon}>📱</Text> Phone number
                    </Text>
                    <TextInput
                        placeholderTextColor={'#999'}
                        placeholder="Enter your phone number"
                        style={styles.input}
                        value={number}
                        onChangeText={setNumber}
                        keyboardType="number-pad"
                    />
                </View>

                {itemStatus === 'lost' && (
                    <>
                        <View style={styles.formSection}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>📚</Text> Course (optional)
                            </Text>
                            <TextInput
                                placeholderTextColor={'#999'}
                                placeholder="Enter your course"
                                style={styles.input}
                                value={course}
                                onChangeText={setCourse}
                                keyboardType="default"
                            />
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.label}>
                                <Text style={styles.labelIcon}>🎓</Text> Year of study (optional)
                            </Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedYear}
                                    onValueChange={(itemValue) => setSelectedYear(itemValue)}
                                    style={styles.picker}
                                    dropdownIconColor="#666"
                                >
                                    <Picker.Item label="Select year" value="" color="#999" />
                                    <Picker.Item label="1st Year" value="1" />
                                    <Picker.Item label="2nd Year" value="2" />
                                    <Picker.Item label="3rd Year" value="3" />
                                    <Picker.Item label="4th Year" value="4" />
                                </Picker>
                            </View>
                        </View>
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
                    </>
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

            {/* Message Pop up */}
            <ModalPopup
                visible={modalVisible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={() => setModalVisible(false)}
            />
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
        padding: 10,
        borderRadius: 15,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
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
        paddingLeft: 5
        // textAlign: 'center',
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
    pickerContainer: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
        color: '#2c3e50',
    },
});
