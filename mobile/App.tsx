import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
    };
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#f7fafd" />
      <View style={styles.webViewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://mediqrfixed.vercel.app/?app=true' }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowsBackForwardNavigationGestures={true} // iOS swipe navigation
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003d9b" />
              <Text style={styles.loadingText}>Loading MediQR...</Text>
            </View>
          )}
          style={styles.webView}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd',
  },
  webViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f7fafd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#434654',
    fontFamily: 'System',
    fontWeight: '500',
  },
});
