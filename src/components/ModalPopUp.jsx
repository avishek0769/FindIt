import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';

const ModalPopup = ({ 
    visible, 
    type = 'success', // success, error, warning
    title, 
    message, 
    onClose,
    primaryAction,
    secondaryAction
}) => {
    const getIconByType = () => {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return '💡';
        }
    };

    const getColorByType = () => {
        switch(type) {
            case 'success': return '#4CAF50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={[styles.iconContainer, { backgroundColor: "white" }]}>
                        <Text style={styles.icon}>{getIconByType()}</Text>
                    </View>
                    
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {secondaryAction && (
                            <Pressable
                                style={[styles.button, styles.secondaryButton]}
                                onPress={secondaryAction.onPress}
                                android_ripple={{ color: '#ddd' }}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    {secondaryAction.label}
                                </Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={[
                                styles.button, 
                                styles.primaryButton,
                                { backgroundColor: getColorByType() }
                            ]}
                            onPress={primaryAction?.onPress || onClose}
                            android_ripple={{ color: '#fff3' }}
                        >
                            <Text style={styles.primaryButtonText}>
                                {primaryAction?.label || 'OK'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        alignItems: 'center',
        elevation: 5,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 30,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 100,
        elevation: 2,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
    },
    secondaryButton: {
        backgroundColor: '#f5f5f5',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ModalPopup;