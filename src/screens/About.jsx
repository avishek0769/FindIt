import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native'
import React from 'react'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function About() {
    const handleLink = (url) => {
        Linking.openURL(url);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.heading}>FindIt</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About the App</Text>
                    <Text style={styles.description}>
                        FindIt is a community-driven lost and found platform designed specifically for the students of NSHM College of Management & Technology.
                    </Text>
                    <Text style={[styles.description, { marginTop: 10 }]}>
                        Our mission is to create a simple, reliable, and collaborative system within the college campus, allowing everyone to report lost items quickly and help others reconnect with their belongings.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Features</Text>
                    <View style={styles.featuresList}>
                        {[
                            'Report lost items with details and images',
                            'Report found items to help others',
                            'Simple and intuitive interface',
                            'Direct contact through email or call'
                        ].map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Developer</Text>
                    <View style={styles.developerInfo}>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="account" size={20} color="#2c3e50" />
                            <Text style={styles.label}>Name:</Text>
                            <Text style={styles.info}>Avishek Adhikary</Text>
                        </View>
                        <View style={[styles.infoRow, ]}>
                            <MaterialCommunityIcons name="school" size={20} color="#2c3e50" />
                            <Text style={styles.label}>Course:</Text>
                            <Text style={styles.info}>BCA, Batch 2024</Text>
                        </View>

                        <View style={styles.socialLinks}>
                            <Pressable
                                style={styles.socialButton}
                                onPress={() => handleLink('mailto:avishekadhikary.24@nshm.edu.in')}
                            >
                                <MaterialCommunityIcons name="email" size={24} color="#1a73e8" />
                            </Pressable>

                            <Pressable
                                style={styles.socialButton}
                                onPress={() => handleLink('https://github.com/avishek0769')}
                            >
                                <MaterialCommunityIcons name="github" size={24} color="#333" />
                            </Pressable>

                            <Pressable
                                style={styles.socialButton}
                                onPress={() => handleLink('https://www.linkedin.com/in/avishekadhikary/')}
                            >
                                <MaterialCommunityIcons name="linkedin" size={24} color="#0077b5" />
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.copyright}>
                        © {new Date().getFullYear()} FindIt. All rights reserved.
                    </Text>
                    <Text style={styles.legal}>
                        This app is provided "as is" without any warranties of any kind.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        paddingTop: 6
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
    },
    heading: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a73e8',
        marginBottom: 8,
    },
    version: {
        fontSize: 14,
        color: '#666',
        letterSpacing: 1,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e9ecef"
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 15,
        color: '#4a5568',
        lineHeight: 24,
    },
    featuresList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1a73e8',
        marginRight: 12,
    },
    featureText: {
        flex: 1,
        fontSize: 15,
        color: '#4a5568',
        lineHeight: 22,
    },
    developerCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 20,
    },
    developerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 16,
    },
    contactLinks: {
        gap: 8,
    },
    contactButton: {
        backgroundColor: '#1a73e8',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        elevation: 0.6,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    copyright: {
        fontSize: 13,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 4,
    },
    legal: {
        fontSize: 12,
        color: '#a0aec0',
        textAlign: 'center',
    },
    developerInfo: {
        gap: 16,
    },
    socialLinks: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 24,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    socialButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginRight: 8,
    },
    info: {
        flex: 1,
        fontSize: 16,
        color: '#4a5568',
    },
});