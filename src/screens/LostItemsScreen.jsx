import { StyleSheet, Text, View, Image, ActivityIndicator, Pressable, Linking, TextInput, Modal, FlatList, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import '@react-native-firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, startAfter, Timestamp, updateDoc, where } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import ModalPopup from '../components/ModalPopUp';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
                            android_ripple={{ color: '#ddd' }}
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            android_ripple={{ color: '#ddd' }}
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
    const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
    const [hasMoreItems, setHasMoreItems] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('latest');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const debounceTimeout = useRef(null)
    const initialFetchedDone = useRef(false);


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

    const handleSearch = useCallback(async (text) => {
        setIsSearching(true);

        try {
            const collectionRef = collection(db, "lostItems");
            const searchText = text.toLowerCase();

            // Create base query with search
            let q = query(
                collectionRef,
                where("keywords", "array-contains", searchText.toLowerCase())
            );

            // Add status filter to search query
            if (statusFilter === 'found') {
                q = query(
                    collectionRef,
                    where("keywords", "array-contains", searchText.toLowerCase()),
                    where("isFound", "==", true)
                );
            } else if (statusFilter === 'notFound') {
                q = query(
                    collectionRef,
                    where("keywords", "array-contains", searchText.toLowerCase()),
                    where("isFound", "==", false)
                );
            }

            const querySnapshot = await getDocs(q);
            let items = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const date = data.dateLost?.toDate();

                return {
                    id: doc.id,
                    ...data,
                    dateLost: date ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` : null,
                    dateObject: date,
                };
            });

            // Apply time filter to search results
            if (timeFilter !== 'all') {
                const now = new Date();
                let cutoffDate = new Date();

                if (timeFilter === 'week') {
                    cutoffDate.setDate(now.getDate() - 7);
                } else if (timeFilter === 'month') {
                    cutoffDate.setMonth(now.getMonth() - 1);
                }

                items = items.filter(item => {
                    if (!item.dateObject) return false;
                    return item.dateObject >= cutoffDate;
                });
            }

            // Apply sorting to search results
            items.sort((a, b) => {
                if (!a.dateObject || !b.dateObject) return 0;

                if (sortBy === 'latest') {
                    return b.dateObject - a.dateObject;
                } else {
                    return a.dateObject - b.dateObject;
                }
            });

            // Remove the temporary dateObject
            items = items.map(item => {
                const { dateObject, ...itemWithoutDateObject } = item;
                return itemWithoutDateObject;
            });

            setLostItems(items);
        } catch (error) {
            console.log(error);
            setModalConfig({
                type: "error",
                title: "Search Error",
                message: "Unable to perform search. Please try again."
            });
            setModalVisible(true);
        } finally {
            setIsSearching(false);
        }
    }, [statusFilter, timeFilter, sortBy]);

    useEffect(() => {
        if (!initialFetchedDone.current) return;

        clearTimeout(debounceTimeout.current)
        if (searchQuery.trim() === '') {
            resetAndFetchItems();
            initialFetchedDone.current = true;
        } else {
            debounceTimeout.current = setTimeout(() => {
                handleSearch(searchQuery);
            }, 400);
        }
        return () => clearTimeout(debounceTimeout.current);
    }, [searchQuery])


    const fetchItemsWithAppliedFilters = async (isInitial = false) => {
        if (isFetching || (!isInitial && !hasMoreItems)) return;

        if(isInitial) setIsFetching(true);
        else {
            setIsFetchingMore(true)
            // await new Promise(resolve => setTimeout(resolve, 2500));
        }

        try {
            const collectionRef = collection(db, "lostItems");

            let filters = [];

            if (statusFilter === 'found') {
                filters.push(where("isFound", "==", true));
            } else if (statusFilter === 'notFound') {
                filters.push(where("isFound", "==", false));
            } else {
                filters.push(orderBy("isFound", "asc"));
            }

            filters.push(orderBy("dateLost", "desc")); // Always sort by dateLost
            if (!isInitial && lastVisibleDoc) {
                filters.push(startAfter(lastVisibleDoc));
            }
            filters.push(limit(3)); // Pagination size

            const q = query(collectionRef, ...filters);
            const snapshot = await getDocs(q);

            let newItems = snapshot.docs.map(doc => {
                const data = doc.data();
                const date = data.dateLost?.toDate();
                return {
                    id: doc.id,
                    ...data,
                    dateLost: date ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` : null,
                    dateObject: date,
                };
            });
            console.log(newItems)

            // Apply time filter
            if (timeFilter !== 'all') {
                const now = new Date();
                const cutoff = new Date();
                if (timeFilter === 'week') cutoff.setDate(now.getDate() - 7);
                else if (timeFilter === 'month') cutoff.setMonth(now.getMonth() - 1);

                newItems = newItems.filter(item => item.dateObject && item.dateObject >= cutoff);
            }

            // Sorting if needed (optional because dateLost is already ordered)
            if (sortBy === 'latest') {
                newItems.sort((a, b) => b.dateObject - a.dateObject);
            } else {
                newItems.sort((a, b) => a.dateObject - b.dateObject);
            }

            // Remove temp fields
            newItems = newItems.map(({ dateObject, ...rest }) => rest);

            setLostItems(prev => isInitial ? newItems : [...prev, ...newItems]);

            // Update pagination states
            if (snapshot.docs.length < 2) {
                setHasMoreItems(false);
            }

            if (snapshot.docs.length > 0) {
                setLastVisibleDoc(snapshot.docs[snapshot.docs.length - 1]);
            }

        }
        catch (err) {
            console.error("Error in pagination:", err);
            setModalConfig({
                type: "error",
                title: "Fetch Error",
                message: "Could not load more items. Please try again.",
            });
            setModalVisible(true);
        }
        finally {
            setIsFetching(false);
            setIsFetchingMore(false);
        }
    };


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

    const renderItem = ({ item }) => (
        <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
                {item.image && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: item.image.replace('/upload/', '/upload/q_auto,f_auto,w_800/') }}
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
                                <View style={styles.iconTextRow}>
                                    <MaterialCommunityIcons name="map-marker" size={16} color="#2c3e50" />
                                    <Text style={styles.label}> Last seen at:  </Text>
                                    <Text>{item.location}</Text>
                                </View>
                            </Text>
                            <Text style={styles.info}>
                                <View style={styles.iconTextRow}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#2c3e50" />
                                    <Text style={styles.label}> Lost on:  </Text>
                                    <Text>{item.dateLost} at {item.timeLost}</Text>
                                </View>
                            </Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Contact Information</Text>
                            <Text style={styles.info}>
                                <View style={styles.iconTextRow}>
                                    <MaterialCommunityIcons name="account" size={16} color="#2c3e50" />
                                    <Text style={styles.label}> Name:  </Text>
                                    <Text>{item.fullname}</Text>
                                </View>
                            </Text>
                            <Pressable onPress={() => handleCall(item.number)}>
                                <Text style={styles.info}>
                                    <View style={styles.iconTextRow}>
                                        <MaterialCommunityIcons name="phone" size={16} color="#2c3e50" />
                                        <Text style={styles.label}> Phone:  </Text>
                                        <Text style={styles.clickable}>{item.number}</Text>
                                    </View>
                                </Text>
                            </Pressable>
                            <Pressable onPress={() => handleEmail(item.email)}>
                                <Text style={[styles.info, styles.clickable]}>
                                    <View style={styles.iconTextRow}>
                                        <MaterialCommunityIcons name="email" size={16} color="#2c3e50" />
                                        <Text style={styles.label}> Email:  </Text>
                                        <Text style={styles.clickable}>{item.email}</Text>
                                    </View>
                                </Text>
                            </Pressable>
                        </View>

                        {(item.course || item.year) && (
                            <View style={styles.infoSection}>
                                <Text style={styles.sectionTitle}>Student Details</Text>
                                {item.course && (
                                    <Text style={styles.info}>
                                        <View style={styles.iconTextRow}>
                                            <MaterialCommunityIcons name="book-open" size={16} color="#2c3e50" />
                                            <Text style={styles.label}> Course:  </Text>
                                            <Text>{item.course}</Text>
                                        </View>
                                    </Text>
                                )}
                                {item.year && (
                                    <Text style={styles.info}>
                                        <View style={styles.iconTextRow}>
                                            <MaterialCommunityIcons name="school" size={16} color="#2c3e50" />
                                            <Text style={styles.label}> Year:  </Text>
                                            <Text>{item.year}</Text>
                                        </View>
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
                {!item.isFound && (
                    <Pressable
                        android_ripple={{ color: '#ddd' }}
                        style={styles.markFoundButton}
                        onPress={() => handleMarkFound(item.id)}
                    >
                        <Text style={styles.markFoundButtonText}>Mark as Found</Text>
                        <Text style={styles.markFoundIcon}>✓</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );

    // Add useEffect to trigger fetchItemsWithAppliedFilters when filter states change
    useEffect(() => {
        if (searchQuery.trim() === '') {
            console.log("Filter Changed");
            resetAndFetchItems();
            initialFetchedDone.current = true;
        }
    }, [statusFilter, timeFilter, sortBy]);


    const FilterSection = () => {
        const filters = {
            status: [
                { label: 'All', value: 'all' },
                { label: 'Found', value: 'found' },
                { label: 'Not Found', value: 'notFound' }
            ],
            time: [
                { label: 'All Time', value: 'all' },
                { label: 'Last Week', value: 'week' },
                { label: 'Last Month', value: 'month' }
            ],
            sort: [
                { label: 'Latest', value: 'latest' },
                { label: 'Oldest', value: 'oldest' }
            ]
        };

        const getActiveLabel = (type) => {
            let value;
            switch (type) {
                case 'status':
                    value = filters.status.find(f => f.value === statusFilter)?.label;
                    break;
                case 'time':
                    value = filters.time.find(f => f.value === timeFilter)?.label;
                    break;
                case 'sort':
                    value = filters.sort.find(f => f.value === sortBy)?.label;
                    break;
            }
            return value;
        };

        const handleFilterSelect = (type, value) => {
            // Update the respective filter state
            switch (type) {
                case 'status':
                    setStatusFilter(value);
                    break;
                case 'time':
                    setTimeFilter(value);
                    break;
                case 'sort':
                    setSortBy(value);
                    break;
            }

            // Close the dropdown
            setActiveDropdown(null);

            // If there's no active search, apply filters immediately
            if (searchQuery.trim() === '') {
                // The useEffect will handle calling fetchItemsWithAppliedFilters
            } else {
                // If there's an active search, re-run the search with new filters
                handleSearch(searchQuery);
            }
        };

        return (
            <View style={styles.filterContainer}>
                {/* Filter Buttons with Horizontal Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {[
                        { type: 'status', label: 'Status', icon: 'filter-variant' },
                        { type: 'time', label: 'Time', icon: 'clock-outline' },
                        { type: 'sort', label: 'Sort By', icon: 'sort' }
                    ].map(({ type, label, icon }) => (
                        <Pressable
                            key={type}
                            style={[
                                styles.filterButton,
                                activeDropdown === type && styles.filterButtonActive
                            ]}
                            onPress={() => setActiveDropdown(activeDropdown === type ? null : type)}
                        >
                            <MaterialCommunityIcons
                                name={icon}
                                size={16}
                                color={activeDropdown === type ? "#1a73e8" : "#666"}
                            />
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    activeDropdown === type && styles.filterButtonTextActive
                                ]}
                                numberOfLines={1}
                            >
                                {getActiveLabel(type)}
                            </Text>
                            <MaterialCommunityIcons
                                name={activeDropdown === type ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={activeDropdown === type ? "#1a73e8" : "#666"}
                            />
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Dropdown Options */}
                {activeDropdown && (
                    <View style={styles.dropdownContainer}>
                        {filters[activeDropdown].map(option => (
                            <Pressable
                                key={option.value}
                                style={[
                                    styles.dropdownOption,
                                    (activeDropdown === 'status' && statusFilter === option.value) ||
                                        (activeDropdown === 'time' && timeFilter === option.value) ||
                                        (activeDropdown === 'sort' && sortBy === option.value) ?
                                        styles.dropdownOptionActive : null
                                ]}
                                onPress={() => handleFilterSelect(activeDropdown, option.value)}
                            >
                                <Text style={[
                                    styles.dropdownOptionText,
                                    (activeDropdown === 'status' && statusFilter === option.value) ||
                                        (activeDropdown === 'time' && timeFilter === option.value) ||
                                        (activeDropdown === 'sort' && sortBy === option.value) ?
                                        styles.dropdownOptionTextActive : null
                                ]}>
                                    {option.label}
                                </Text>
                                {((activeDropdown === 'status' && statusFilter === option.value) ||
                                    (activeDropdown === 'time' && timeFilter === option.value) ||
                                    (activeDropdown === 'sort' && sortBy === option.value)) && (
                                        <MaterialCommunityIcons name="check" size={16} color="#1a73e8" />
                                    )}
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const resetAndFetchItems = () => {
        setLastVisibleDoc(null);
        setHasMoreItems(true);
        setLostItems([]);
        fetchItemsWithAppliedFilters(true); // true = initial load
    };


    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.heading}>Lost Items</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by description or location"
                        placeholderTextColor={'#999'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        onSubmitEditing={() => handleSearch(searchQuery)}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close" size={20} color="#666" />
                        </Pressable>
                    )}
                    {isSearching && (
                        <ActivityIndicator size={20} color="#1a73e8" style={styles.searchIndicator} />
                    )}
                </View>
            </View>

            <FilterSection />

            {isFetching ? (
                <View style={{ flex: 1, justifyContent: "center" }}>
                    <ActivityIndicator size={50} color={"#1a73e8"} />
                </View>
            ) : (
                <FlatList
                    data={lostItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    onEndReached={() => {
                        console.log("End reached");
                        !isFetchingMore? fetchItemsWithAppliedFilters(false) : null;
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isFetchingMore && <ActivityIndicator size="large" color={"#1a73e8"} />}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No lost items found</Text>
                        </View>
                    )}
                    removeClippedSubviews={true}
                    initialNumToRender={5}
                    maxToRenderPerBatch={10}
                    windowSize={7}
                />
            )}

            <VerificationPopup
                visible={isVerificationVisible}
                onClose={() => setIsVerificationVisible(false)}
                onVerify={handleVerification}
                code={verificationCode}
                setCode={setVerificationCode}
            />

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
        backgroundColor: '#fff',
    },
    headerContainer: {
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
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
        fontSize: 17,
        fontWeight: '500',
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
    iconTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    listContainer: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f6f8',
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        height: 44,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
        height: '100%',
    },
    searchIndicator: {
        marginLeft: 8,
    },
    filterContainer: {
        backgroundColor: '#fff',
        zIndex: 1,
    },
    filterButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f5f6f8',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 6,
        minWidth: 140,
        maxWidth: 250,
    },
    filterButtonActive: {
        backgroundColor: '#e8f0fe',
        borderColor: '#1a73e8',
    },
    filterButtonText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        flex: 1,
        textAlign: 'center',
    },
    filterButtonTextActive: {
        color: '#1a73e8',
        fontWeight: '600',
    },
    dropdownContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        maxHeight: 200,
    },
    dropdownOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownOptionActive: {
        backgroundColor: '#f8f9ff',
    },
    dropdownOptionText: {
        fontSize: 14,
        color: '#333',
    },
    dropdownOptionTextActive: {
        color: '#1a73e8',
        fontWeight: '500',
    },
    filterScrollContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
});