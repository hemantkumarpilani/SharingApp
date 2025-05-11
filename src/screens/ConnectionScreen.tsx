import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import React, {FC, useEffect, useState} from 'react';
import {useTCP} from '../service/TCPProvider';
import Icon from '../components/global/Icon';
import {resetAndNavigate} from '../utils/NavigationUtil';
import LinearGradient from 'react-native-linear-gradient';
import {sendStyles} from '../styles/sendStyles';
import {SafeAreaView} from 'react-native-safe-area-context';
import {connectionStyles} from '../styles/connectionStyles';
import CustomText from '../components/global/CustomText';
import Options from '../components/home/Options';
import {formatFileSize} from '../utils/libraryHelpers';
import {Colors} from '../utils/Constants';
import ReactNativeBlobUtil from 'react-native-blob-util';

const ConnectionScreen: FC = () => {
  const {
    connectedDevice,
    disconnect,
    sendFileAck,
    sentFiles,
    receivedFiles,
    totalReceivedBytes,
    totalSentBytes,
    isConnected,
  } = useTCP();

  const [activeTab, setActiveTab] = useState<'SENT' | 'RECEIVED'>('SENT'); // 'SENT' | 'RECEIVED'>

  const renderThumbnail = (mimeType: string) => {
    switch (mimeType) {
      case 'mp3':
        return (
          <Icon
            name="musical-notes"
            size={16}
            color="blue"
            iconFamily="IoniIcons"
          />
        );
      case 'mp4':
        return (
          <Icon
            name="videocam"
            size={16}
            color="green"
            iconFamily="IoniIcons"
          />
        );
      case 'jpg':
        return (
          <Icon name="image" size={16} color="orange" iconFamily="IoniIcons" />
        );
      case 'pdf':
        return (
          <Icon name="document" size={16} color="red" iconFamily="IoniIcons" />
        );
      default:
        return (
          <Icon name="folder" size={16} color="gray" iconFamily="IoniIcons" />
        );
    }
  };

  const onMediaPickedUp = (image: any) => {
    console.log('Picked image', image);
    sendFileAck(image, 'image');
  };

  const onFilePickedUp = (file: any) => {
    console.log('Picked file', file);
    sendFileAck(file, 'file');
  };

  useEffect(() => {
    if (!isConnected) {
      resetAndNavigate('HomeScreen');
    }
  }, [isConnected]);

  const handleTabChange = (tab: 'SENT' | 'RECEIVED') => {
    setActiveTab(tab);
  };

  const renderItem = ({item}: any) => {
    console.log('renderItem renderItem', item);
    return (
      <View style={connectionStyles.fileItem}>
        <View style={connectionStyles.fileInfoContainer}>
          {renderThumbnail(item?.mimeType)}
          <View style={connectionStyles?.fileDetails}>
            <CustomText numberOfLines={1} fontFamily="Okra-Bold" fontSize={10}>
              {item?.name}
            </CustomText>
            <CustomText>
              {item?.mimeType} • {formatFileSize(item?.size)}{' '}
            </CustomText>
          </View>
        </View>

        {item?.available ? (
          <TouchableOpacity
            onPress={() => {
              const normalizedPath =
                Platform.OS === 'ios' ? `file://${item.uri}` : item?.uri;

              if (Platform.OS === 'ios') {
                ReactNativeBlobUtil.ios
                  .openDocument(normalizedPath)
                  .then(() => console.log('File opened successfully'))
                  .catch(err => console.error('Error opening files', err));
              } else {
                ReactNativeBlobUtil.android
                  .actionViewIntent(normalizedPath, '*/*')
                  .then(() => console.log('File opened successfully'))
                  .catch(err => console.error('Error opening files', err));
              }
            }}
            style={connectionStyles.openButton}>
            <CustomText
              numberOfLines={1}
              color="#fff"
              fontFamily="Okra-Bold"
              fontSize={9}>
              Open
            </CustomText>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator color={Colors.primary} size={'small'} />
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#cddaee', '#8dbaff']}
      style={sendStyles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <SafeAreaView />
      <View style={sendStyles.mainContainer}>
        <View style={connectionStyles.container}>
          <View style={connectionStyles.connectionContainer}>
            <View style={{width: '55%'}}>
              <CustomText numberOfLines={1} fontFamily="Okra-Medium">
                Connected with
              </CustomText>

              <CustomText
                numberOfLines={1}
                fontFamily="Okra-Bold"
                fontSize={14}>
                {connectedDevice || 'Unknown'}
              </CustomText>
            </View>

            <TouchableOpacity
              onPress={() => disconnect()}
              style={connectionStyles.disconnectButton}>
              <Icon
                name="remove-circle"
                size={12}
                color="red"
                iconFamily="IoniIcons"
              />
              <CustomText
                numberOfLines={1}
                fontFamily="Okra-Bold"
                fontSize={10}>
                Disconnect
              </CustomText>
            </TouchableOpacity>
          </View>
          <Options
            onMediaPickedUp={onMediaPickedUp}
            onFilePickedUp={onFilePickedUp}
          />

          <View style={connectionStyles.fileContainer}>
            <View style={connectionStyles.sendReceiveContainer}>
              <View style={connectionStyles.sendReceiveButtonContainer}>
                <TouchableOpacity
                  onPress={() => handleTabChange('SENT')}
                  style={[
                    connectionStyles.sendRecieveButton,
                    activeTab === 'SENT'
                      ? connectionStyles.activeButton
                      : connectionStyles.inactiveButton,
                  ]}>
                  <Icon
                    name="cloud-upload"
                    size={12}
                    color={activeTab === 'SENT' ? '#fff' : 'blue'}
                    iconFamily="IoniIcons"
                  />
                  <CustomText
                    numberOfLines={1}
                    fontFamily="Okra-Bold"
                    fontSize={9}
                    color={activeTab === 'SENT' ? '#fff' : '#000'}>
                    Sent
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleTabChange('RECEIVED')}
                  style={[
                    connectionStyles.sendRecieveButton,
                    activeTab === 'RECEIVED'
                      ? connectionStyles.activeButton
                      : connectionStyles.inactiveButton,
                  ]}>
                  <Icon
                    name="cloud-upload"
                    size={12}
                    color={activeTab === 'RECEIVED' ? '#fff' : 'blue'}
                    iconFamily="IoniIcons"
                  />
                  <CustomText
                    numberOfLines={1}
                    fontFamily="Okra-Bold"
                    fontSize={9}
                    color={activeTab === 'RECEIVED' ? '#fff' : '#000'}>
                    Received
                  </CustomText>
                </TouchableOpacity>
              </View>
              <View style={connectionStyles.sendReceiveDataContainer}>
                <CustomText fontFamily="Okra-Bold" fontSize={9}>
                  {formatFileSize(
                    (activeTab === 'SENT'
                      ? totalSentBytes
                      : totalReceivedBytes) || 0,
                  )}
                </CustomText>

                <CustomText fontFamily="Okra-Bold" fontSize={12}>
                  /
                </CustomText>

                <CustomText fontFamily="Okra-Bold" fontSize={10}>
                  {activeTab === 'SENT'
                    ? formatFileSize(
                        sentFiles?.reduce(
                          (total: number, file: any) => total + file.size,
                          0,
                        ),
                      )
                    : formatFileSize(
                        receivedFiles?.reduce(
                          (total: number, file: any) => total + file.size,
                          0,
                        ),
                      )}
                </CustomText>
              </View>
            </View>

            {(activeTab === 'SENT' ? sentFiles.length : receivedFiles.length) >
            0 ? (
              <FlatList
                data={activeTab === 'SENT' ? sentFiles : receivedFiles}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={connectionStyles.fileList}
              />
            ) : (
              <View style={connectionStyles.noDataContainer}>
                <CustomText
                  numberOfLines={1}
                  fontFamily="Okra-Medium"
                  fontSize={11}>
                  {activeTab === 'SENT'
                    ? 'No files sent yet'
                    : 'No files received yet'}
                </CustomText>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={sendStyles.backButton}
          onPress={() => resetAndNavigate('HomeScreen')}>
          <Icon
            name="arrow-back"
            size={16}
            color="#000"
            iconFamily="IoniIcons"
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default ConnectionScreen;
