import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CodeInput from '@/components/ui/CodeInput';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import TextField from '@/components/ui/TextField';
import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useDevices } from '@/hooks/useDevices';

const CODE_LENGTH = 6;

/** What the user does on the device before typing the code (flow 1 of docs/architecture.md). */
const STEPS = [
  'Plug in your desk companion.',
  'On your phone, join the Wi-Fi “DeskCompanion-XXXX”.',
  'On the page that opens, pick your Wi-Fi and note the 6-digit code.',
  'Come back here and type that code.',
];

export default function PairDeviceScreen() {
  const { claim } = useDevices();
  const { actionError, run } = useActionError();
  const [code, setCode] = useState('');
  const [name, setName] = useState('My desk companion');
  const [isPairing, setIsPairing] = useState(false);

  const canPair = code.length === CODE_LENGTH && name.trim() !== '';

  const handlePair = async () => {
    setIsPairing(true);
    const isPaired = await run(
      () => claim(code, name.trim()),
      'Could not pair the device. Check the code shown on its setup page and try again.',
    );
    setIsPairing(false);
    if (isPaired) router.back();
  };

  return (
    <Screen tabBar={false}>
      <TopBar title="Add a device" />

      {/* ----- How to get the code ----- */}
      <Card style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </Card>

      {actionError && <Notice tone="error" message={actionError} />}

      {/* ----- Code and name ----- */}
      <Card style={styles.form}>
        <CodeInput label="Pairing code" value={code} onChange={setCode} length={CODE_LENGTH} />
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="My desk companion"
          maxLength={40}
          returnKeyType="done"
        />
      </Card>

      <Button
        label="Pair the device"
        icon="link"
        onPress={handlePair}
        loading={isPairing}
        disabled={!canPair}
      />
    </Screen>
  );
}

const NUMBER_SIZE = 28;

const styles = StyleSheet.create({
  // ----- Steps -----
  steps: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: NUMBER_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 13,
    color: Colors.ink,
  },
  stepText: {
    flex: 1,
    paddingTop: 4,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },

  // ----- Form -----
  form: {
    gap: 16,
  },
});
