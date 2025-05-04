import {View, Image} from 'react-native';
import React, {useState} from 'react';
import {homeHeaderStyles} from '../../styles/homeHeaderStyles';
import {commonStyles} from '../../styles/commonStyles';
import {TouchableOpacity} from 'react-native';
import Icon from '../global/Icon';
import Svg, {Path, Defs, LinearGradient, Stop} from 'react-native-svg';
import {screenHeight, screenWidth, svgPath} from '../../utils/Constants';
import {SafeAreaView} from 'react-native-safe-area-context';
import QRGenerateModal from '../modal/QRGenerateModal';

const HomeHeader = () => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <View style={homeHeaderStyles.mainContainer}>
      <SafeAreaView />
      <View style={[commonStyles.flexRowBetween, homeHeaderStyles.container]}>
        <TouchableOpacity>
          <Icon iconFamily="IoniIcons" name="menu" size={22} color="#fff" />
        </TouchableOpacity>
        <Image
          source={require('../../assets/images/logo_t.png')}
          style={homeHeaderStyles.logo}
        />
        <TouchableOpacity onPress={() => setIsVisible(true)}>
          <Image
            source={require('../../assets/images/profile.jpg')}
            style={homeHeaderStyles.profile}
          />
        </TouchableOpacity>
      </View>
      <Svg
        height={screenHeight * 0.17}
        width={screenWidth}
        viewBox="0 0 1440 220"
        style={homeHeaderStyles.curve}>
        <Defs>
          <LinearGradient id="grad" x1={'0'} y1={'0'} x2={'1'} y2={'1'}>
            <Stop offset={'0%'} stopColor={'#007AFF'} stopOpacity={'1'} />
            <Stop offset={'100%'} stopColor={'#80BFFF'} stopOpacity={'1'} />
          </LinearGradient>
        </Defs>

        <Path fill={'#80BFFF'} d={svgPath} />
        <Path fill="url(#grad)" d={svgPath} />
      </Svg>

      {isVisible && (
        <QRGenerateModal
          visible={isVisible}
          onClose={() => setIsVisible(false)}
        />
      )}
    </View>
  );
};

export default HomeHeader;
