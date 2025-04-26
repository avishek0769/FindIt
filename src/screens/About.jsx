import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native'
import React from 'react'

export default function About() {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.heading}>FindIt</Text>
                <Text style={styles.version}>Version 1.0.0</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About the App</Text>
                    <Text style={styles.description}>
                        FindIt is a community-driven lost and found platform designed specifically for the students of our college.
                    </Text>
                    <Text style={[styles.description, { marginTop: 10 }]}>
                        Our mission is to create a simple, reliable, and collaborative system within the college campus, allowing everyone to report lost items quickly and help others reconnect with their belongings.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Features</Text>
                    <Text style={styles.bulletPoint}>• Report lost items with details and images</Text>
                    <Text style={styles.bulletPoint}>• Report found items to help others</Text>
                    <Text style={styles.bulletPoint}>• Simple and intuitive interface</Text>
                    <Text style={styles.bulletPoint}>• Direct contact through email or call</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Developer</Text>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.info}>Avishek Adhikary</Text>

                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.info}
                        onPress={() => Linking.openURL('mailto:avishekadhikary.24@nshm.edu.in')}>
                        avishekadhikary.24@nshm.edu.in
                    </Text>

                    <Text style={styles.label}>GitHub:</Text>
                    <Text style={styles.info}
                        onPress={() => Linking.openURL('https://github.com/avishek0769')}>
                        github.com/avishek0769
                    </Text>
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
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    heading: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
    },
    version: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    bulletPoint: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
        lineHeight: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginTop: 8,
    },
    info: {
        fontSize: 16,
        color: '#0066cc',
        marginBottom: 8,
    },
    footer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    copyright: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    legal: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});