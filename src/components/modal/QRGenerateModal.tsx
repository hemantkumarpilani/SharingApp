/* eslint-disable @typescript-eslint/no-unused-vars */
import {View, Modal, ActivityIndicator, TouchableOpacity} from 'react-native';
import React, {FC, useEffect, useState} from 'react';
import {modalStyles} from '../../styles/modalStyles';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import QrCode from 'react-native-qrcode-svg';
import {multiColor} from '../../utils/Constants';
import CustomText from '../global/CustomText';
import Icon from '../global/Icon';
import {useTCP} from '../../service/TCPProvider';
import DeviceInfo from 'react-native-device-info';
import {getLocalIPAddress} from '../../utils/networkUtils';
import {navigate} from '../../utils/NavigationUtil';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

const QRGenerateModal: FC<ModalProps> = ({onClose, visible}) => {
  const {isConnected, startServer, server} = useTCP();
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('Hemant');
  const shimmerTranslateX = useSharedValue(-300);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{translateX: shimmerTranslateX.value}],
  }));

  const setUpServer = async () => {
    const deviceName = await DeviceInfo.getDeviceName();
    const ip = await getLocalIPAddress();
    const port = 4000;

    if (server) {
      setQrValue(`tcp://${ip}:${port}|${deviceName}`);
      setLoading(false);
      return;
    }
    startServer(port);
    setQrValue(`tcp://${ip}:${port}|${deviceName}`);
    console.log(`server info :${ip}:${port}`);
    setLoading(false);
  };

  useEffect(() => {
    shimmerTranslateX.value = withRepeat(
      withTiming(300, {duration: 1500, easing: Easing.linear}),
      -1,
      false,
    );

    if (visible) {
      setLoading(true);
      setUpServer();
    }
  }, [visible]);

  useEffect(() => {
    console.log('TCP Provider : isConnected updated to', isConnected);
    if (isConnected) {
      onClose();
      navigate('ConnectionScreen');
    }
  }, [isConnected]);
  return (
    <Modal
      animationType="slide"
      visible={visible}
      presentationStyle="formSheet"
      onRequestClose={onClose}
      onDismiss={onClose}>
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.qrContainer}>
          {loading || qrValue === null || qrValue == '' ? (
            <View style={modalStyles.skeleton}>
              <Animated.View style={[modalStyles.shimmerOverlay, shimmerStyle]}>
                <LinearGradient
                  colors={['#f3f3f3', '#fff', '#f3f3f3']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={modalStyles.shimmerGradient}
                />
              </Animated.View>
            </View>
          ) : (
            <QrCode
              value={qrValue}
              size={250}
              logoSize={60}
              logoBackgroundColor="#fff"
              logoMargin={2}
              logoBorderRadius={10}
              logo={require('../../assets/images/profile3.jpg')}
              linearGradient={multiColor}
              enableLinearGradient
            />
          )}
        </View>

        <View style={modalStyles.info}>
          <CustomText style={modalStyles.infoText1}>
            Ensure you're on the same Wi-Fi network
          </CustomText>
          <CustomText style={modalStyles.infoText2}>
            Ask the sender to scan this QR code to connect and transfer files
          </CustomText>
        </View>

        <ActivityIndicator
          size={'small'}
          color={'#000'}
          style={{alignSelf: 'center'}}
        />

        <TouchableOpacity
          onPress={() => onClose()}
          style={[modalStyles.closeButton]}>
          <Icon name="close" iconFamily="IoniIcons" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default QRGenerateModal;
