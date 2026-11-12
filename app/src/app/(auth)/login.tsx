import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { isAuthError } from '@supabase/supabase-js';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import TextField from '@/components/ui/TextField';
import TextLink from '@/components/ui/TextLink';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { signInWithEmail } from '@/services/auth';

/** Turns a Supabase error into a sentence the user can act on. */
function errorMessage(error: unknown): string {
  if (isAuthError(error)) {
    if (error.code === 'invalid_credentials') return 'Wrong email or password.';
    if (error.code === 'email_not_confirmed') return 'Confirm your email first: check your inbox.';
    if (error.status === 0) return 'No connection. Check your network and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim() !== '' && password !== '';

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // On success, AuthProvider receives the session and the root layout opens the tabs.
      await signInWithEmail(email.trim(), password);
    } catch (caught) {
      setError(errorMessage(caught));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      footer={
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>New here?</Text>
          <TextLink label="Create an account" onPress={() => router.replace('/signup')} />
        </View>
      }
    >
      {error && <Notice tone="error" message={error} />}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label="Password"
        password
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={canSubmit ? handleSubmit : undefined}
      />

      <Button
        label="Log in"
        icon="arrow-right"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
        style={styles.submit}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
