import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
      <Layout style={styles.titleContainer}>
        <Text category="h1">Explore</Text>
      </Layout>
      <Text>This app includes example code to help you get started.</Text>
      <Collapsible title="File-based routing">
        <Text>
          This app has two screens: <Text category="s1">app/(tabs)/index.tsx</Text> and{' '}
          <Text category="s1">app/(tabs)/explore.tsx</Text>
        </Text>
        <Text>
          The layout file in <Text category="s1">app/(tabs)/_layout.tsx</Text> sets up the tab
          navigator.
        </Text>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <Text category="c1">Learn more</Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <Text>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <Text category="s1">w</Text> in the terminal running this project.
        </Text>
      </Collapsible>
      <Collapsible title="Images">
        <Text>
          For static images, you can use the <Text category="s1">@2x</Text> and{' '}
          <Text category="s1">@3x</Text> suffixes to provide files for different screen densities
        </Text>
        <Image source={require('@/assets/images/react-logo.png')} style={{ alignSelf: 'center' }} />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <Text category="c1">Learn more</Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Custom fonts">
        <Text>
          Open <Text category="s1">app/_layout.tsx</Text> to see how to load{' '}
          <Text style={{ fontFamily: 'SpaceMono' }}>custom fonts such as this one.</Text>
        </Text>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <Text category="c1">Learn more</Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <Text>
          This template has light and dark mode support. The <Text category="s1">useColorScheme()</Text>{' '}
          hook lets you inspect what the user's current color scheme is, and so you can adjust UI colors
          accordingly.
        </Text>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <Text category="c1">Learn more</Text>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <Text>
          This template includes an example of an animated component. The{' '}
          <Text category="s1">components/HelloWave.tsx</Text> component uses the powerful{' '}
          <Text category="s1">react-native-reanimated</Text> library to create a waving hand animation.
        </Text>
        {Platform.select({
          ios: (
            <Text>
              The <Text category="s1">components/ParallaxScrollView.tsx</Text> component provides a parallax effect
              for the header image.
            </Text>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
