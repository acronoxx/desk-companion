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
import { useLanguage } from '@/hooks/useLanguage';

const CODE_LENGTH = 6;

export default function PairDeviceScreen() {
  const { t } = useLanguage();
  const { claim } = useDevices();
  const { actionError, run } = useActionError();
  const [code, setCode] = useState('');
  const [name, setName] = useState(t.devices.defaultName);
  const [isPairing, setIsPairing] = useState(false);

  const canPair = code.length === CODE_LENGTH && name.trim() !== '';

  const handlePair = async () => {
    setIsPairing(true);
    const isPaired = await run(() => claim(code, name.trim()), t.devices.pairError);
    setIsPairing(false);
    if (isPaired) router.back();
  };

  return (
    <Screen tabBar={false}>
      <TopBar title={t.devices.pairTitle} />

      {/* ----- How to get the code ----- */}
      <Card style={styles.steps}>
        {/* What the user does on the device first (flow 1 of docs/architecture.md). */}
        {t.devices.pairSteps.map((step, index) => (
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
        <CodeInput
          label={t.devices.pairingCode}
          value={code}
          onChange={setCode}
          length={CODE_LENGTH}
        />
        <TextField
          label={t.common.name}
          value={name}
          onChangeText={setName}
          placeholder={t.devices.defaultName}
          maxLength={40}
          returnKeyType="done"
        />
      </Card>

      <Button
        label={t.devices.pairButton}
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
