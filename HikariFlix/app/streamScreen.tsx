import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

interface StreamingInfo {
  status: string;
  value: {
    decryptionResult: {
      type: 'sub' | 'dub';
      source: {
        sources: Array<{ file: string; type: string }>;
        tracks: Array<{ file: string; label: string }>;
      };
    };
  };
}

interface LocalSearchParams {
  episodeTitle: string;
  streamingInfo: string;
}

// Type guard to check if the object matches LocalSearchParams
const isLocalSearchParams = (params: any): params is LocalSearchParams => {
  return (
    typeof params === 'object' &&
    params !== null &&
    'episodeTitle' in params &&
    'streamingInfo' in params
  );
};

const StreamScreen: React.FC = () => {
  const params = useLocalSearchParams();

  // Use type guard to ensure the params are of type LocalSearchParams
  if (!isLocalSearchParams(params)) {
    return <Text>Error: Invalid search parameters.</Text>;
  }

  const { episodeTitle, streamingInfo } = params;
  const [currentSource, setCurrentSource] = useState<StreamingInfo['value']['decryptionResult']['source'] | null>(null);
  const [currentType, setCurrentType] = useState<'sub' | 'dub'>('sub');
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  // Parse the streamingInfo safely
  const parsedStreamingInfo: StreamingInfo[] = streamingInfo ? JSON.parse(streamingInfo) : [];

  useEffect(() => {
    if (parsedStreamingInfo?.length > 0) {
      const defaultSource = parsedStreamingInfo.find(info => info.value.decryptionResult.type === 'sub');
      if (defaultSource) {
        setCurrentSource(defaultSource.value.decryptionResult.source);
        setCurrentType('sub');
      }
    }
  }, [parsedStreamingInfo]);

  const handleTypeChange = (type: 'sub' | 'dub') => {
    const newSource = parsedStreamingInfo.find(info => info.value.decryptionResult.type === type);
    if (newSource) {
      setCurrentSource(newSource.value.decryptionResult.source);
      setCurrentType(type);
      setSelectedSubtitleTrack(null); // Reset subtitle when changing type
    }
  };

  const handleSubtitleChange = (trackUri: string | null) => {
    setSelectedSubtitleTrack(trackUri);
    if (videoRef.current) {
      videoRef.current.setStatusAsync({
        textTracks: trackUri ? [{ uri: trackUri, type: 'vtt', language: 'en' }] : undefined,
      } as Partial<AVPlaybackStatus>);
    }
  };

  if (!currentSource) {
    return <Text>Loading...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{episodeTitle}</Text>
      
      <Video
  ref={videoRef}
  source={{ uri: currentSource?.sources[0]?.file }}
  rate={1.0}
  volume={1.0}
  isMuted={false}
  resizeMode={ResizeMode.CONTAIN}  // Correctly using the constant here
  shouldPlay
  useNativeControls
  style={styles.video}
  onError={(error) => console.log('Video Error:', error)} // Handle video load error
/>


      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, currentType === 'sub' && styles.activeButton]}
          onPress={() => handleTypeChange('sub')}
        >
          <Text style={styles.buttonText}>Subbed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, currentType === 'dub' && styles.activeButton]}
          onPress={() => handleTypeChange('dub')}
        >
          <Text style={styles.buttonText}>Dubbed</Text>
        </TouchableOpacity>
      </View>

      {currentSource.tracks && currentSource.tracks.length > 0 && (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleLabel}>Subtitles:</Text>
          <Picker
            selectedValue={selectedSubtitleTrack}
            onValueChange={(itemValue: string | null) => handleSubtitleChange(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="None" value={null} />
            {currentSource.tracks.map((track, index) => (
              <Picker.Item key={index} label={track.label} value={track.file} />
            ))}
          </Picker>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    padding: 10,
    marginHorizontal: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
  },
  subtitleContainer: {
    marginTop: 20,
  },
  subtitleLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 50,
  },
});

export default StreamScreen;
