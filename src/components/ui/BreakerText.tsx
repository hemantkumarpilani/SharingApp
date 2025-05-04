import {View, Text, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import CustomText from '../global/CustomText';

const BreakerText: FC<{text: string}> = ({text}) => {
  return (
    <View style={styles.breakContainer}>
      <View style={styles.horizoontalLine} />
      <CustomText
        fontSize={12}
        fontFamily="Okra-Medium"
        style={styles.breakerText}>
        {text}
      </CustomText>
      <View style={styles.horizoontalLine} />
    </View>
  );
};

export default BreakerText;

const styles = StyleSheet.create({
  breakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: '80%',
  },
  horizoontalLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  breakerText: {
    marginHorizontal: 10,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
});
