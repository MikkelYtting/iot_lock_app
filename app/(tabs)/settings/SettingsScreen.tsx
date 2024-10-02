import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Switch, FlatList, TouchableOpacity } from 'react-native';
import { Layout, Text, Icon, Button } from '@ui-kitten/components';
import { useThemeToggle } from '../../_layout';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth } from '../../../firebase';

const { width } = Dimensions.get('window');

type SettingsItem = {
  title: string;
  icon: string;
  notification?: number;
  onPress?: () => void; // Add an onPress property to handle navigation
};

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [isEnabled, setIsEnabled] = useState(isDarkMode);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      router.replace('/login/LoginScreen');
    } catch (error) {
      console.log('Error signing out: ', error);
    }
  };

  const toggleSwitch = () => {
    toggleTheme();
    setIsEnabled((prevState) => !prevState);
  };

  // Define settings items with the correct navigation paths
  const settingsItems: SettingsItem[] = [
    { 
      title: 'Account', 
      icon: 'person-outline', 
      onPress: () => router.push('/(tabs)/settings/AccountScreen')

      // Corrected path
    },
    { title: 'Notifications', icon: 'bell-outline' },
    { title: 'Privacy', icon: 'lock-outline' },
    { title: 'Help center', icon: 'question-mark-circle-outline' },
    { title: 'General', icon: 'settings-outline' },
    { title: 'About us', icon: 'info-outline' },
  ];

  const renderSettingItem = ({ item }: { item: SettingsItem }) => (
    <TouchableOpacity onPress={item.onPress}>
      <View style={styles.settingItem}>
        <Icon name={item.icon} fill="#8F9BB3" style={styles.icon} />
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.notification && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>{item.notification}</Text>
          </View>
        )}
        <Icon name="arrow-ios-forward" fill="#8F9BB3" style={styles.forwardIcon} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Layout style={styles.container}>
      
      <FlatList<SettingsItem>
        data={settingsItems}
        keyExtractor={(item) => item.title}
        renderItem={renderSettingItem}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.settingItem}>
        <Icon name="moon-outline" fill="#8F9BB3" style={styles.icon} />
        <Text style={styles.settingTitle}>Dark Mode</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>
      </View>

      <Button status="danger" onPress={handleLogout} style={styles.logoutButton}>
        Sign Out
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 24,
    marginVertical: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
  },
  settingTitle: {
    fontSize: 16,
    flex: 1,
    marginLeft: 15,
  },
  icon: {
    width: 32,
    height: 32,
  },
  notificationBadge: {
    backgroundColor: '#FF3D71',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10,
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  forwardIcon: {
    width: 24,
    height: 24,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
});
