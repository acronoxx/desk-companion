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
import { signUpWithEmail } from '@/services/auth';

const MIN_PASSWORD_LENGTH = 6;

/** Turns a Supabase error into a sentence the user can act on. */
function errorMessage(error: unknown): string {
  if (isAuthError(error)) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
      return 'An account already uses this email. Log in instead.';
    }
    if (error.code === 'weak_password') return 'This password is too weak. Try a longer one.';
    if (error.code === 'email_address_invalid') return 'This email address is not valid.';
    if (error.status === 0) return 'No connection. Check your network and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** True when the account exists but the email must be confirmed before logging in. */
  const [mustConfirm, setMustConfirm] = useState(false);

  const isPasswordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit =
    displayName.trim() !== '' && email.trim() !== '' && password.length >= MIN_PASSWORD_LENGTH;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { session } = await signUpWithEmail(email.trim(), password, displayName.trim());
      // With a session, AuthProvider opens the tabs by itself.
      if (session === null) setMustConfirm(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.switchRow}>
      <Text style={styles.switchText}>Already have an account?</Text>
      <TextLink label="Log in" onPress={() => router.replace('/login')} />
    </View>
  );

  if (mustConfirm) {
    return (
      <AuthLayout title="Almost there" footer={footer}>
        <Notice
          tone="success"
          message={`We sent a link to ${email.trim()}. Open it to confirm your account, then log in.`}
        />
        <Button label="Go to login" icon="arrow-right" onPress={() => router.replace('/login')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create an account" footer={footer}>
      {error && <Notice tone="error" message={error} />}

      <TextField
        label="First name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Camille"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
      />
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
        placeholder={`${MIN_PASSWORD_LENGTH} characters minimum`}
        autoComplete="new-password"
        textContentType="newPassword"
        error={isPasswordTooShort ? `At least ${MIN_PASSWORD_LENGTH} characters.` : null}
        returnKeyType="go"
        onSubmitEditing={canSubmit ? handleSubmit : undefined}
      />

      <Button
        label="Create my account"
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
