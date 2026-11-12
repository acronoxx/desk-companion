import { StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type NoticeProps = {
  message: string;
  /** error: something failed. success: something worked and the user has a next step. */
  tone: 'error' | 'success';
};

/** A message box shown above a form or a list. */
export default function Notice({ message, tone }: NoticeProps) {
  const isError = tone === 'error';

  return (
    <View
      style={[styles.box, isError ? styles.error : styles.success]}
      accessibilityLiveRegion="polite">
      <Feather
        name={isError ? 'alert-circle' : 'check-circle'}
        size={18}
        color={isError ? Colors.coral : Colors.successText}
      />
      <Text style={[styles.message, { color: isError ? Colors.ink : Colors.successText }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  error: {
    backgroundColor: Colors.white,
    borderColor: Colors.coral,
  },
  success: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  message: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
