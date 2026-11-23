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
import { useLanguage } from '@/hooks/useLanguage';
import type { Strings } from '@/i18n/en';

const MIN_PASSWORD_LENGTH = 6;

/** Turns a Supabase error into a sentence the user can act on. */
function errorMessage(error: unknown, t: Strings['auth']): string {
  if (isAuthError(error)) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
      return t.emailExists;
    }
    if (error.code === 'weak_password') return t.weakPassword;
    if (error.code === 'email_address_invalid') return t.invalidEmail;
    if (error.status === 0) return t.noConnection;
  }
  return t.genericError;
}

export default function SignupScreen() {
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** True when the account exists but the email must be confirmed before logging in. */
  const [mustConfirm, setMustConfirm] = useState(false);

  const isPasswordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  // Only shown once the second field is filled, so the user isn't told off while typing.
  const isConfirmWrong = passwordConfirm.length > 0 && passwordConfirm !== password;
  const canSubmit =
    displayName.trim() !== '' &&
    email.trim() !== '' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    passwordConfirm === password;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { session } = await signUpWithEmail(email.trim(), password, displayName.trim());
      // With a session, AuthProvider opens the tabs by itself.
      if (session === null) setMustConfirm(true);
    } catch (caught) {
      setError(errorMessage(caught, t.auth));
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.switchRow}>
      <Text style={styles.switchText}>{t.auth.alreadyAccount}</Text>
      <TextLink label={t.auth.loginTitle} onPress={() => router.replace('/login')} />
    </View>
  );

  if (mustConfirm) {
    return (
      <AuthLayout title={t.auth.almostThere} footer={footer}>
        <Notice tone="success" message={t.auth.confirmSent(email.trim())} />
        <Button
          label={t.auth.goToLogin}
          icon="arrow-right"
          onPress={() => router.replace('/login')}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t.auth.signupTitle} footer={footer}>
      {error && <Notice tone="error" message={error} />}

      <TextField
        label={t.auth.firstName}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t.auth.firstNamePlaceholder}
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
      />
      <TextField
        label={t.auth.email}
        value={email}
        onChangeText={setEmail}
        placeholder={t.auth.emailPlaceholder}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label={t.auth.password}
        password
        value={password}
        onChangeText={setPassword}
        placeholder={t.auth.passwordMin(MIN_PASSWORD_LENGTH)}
        autoComplete="new-password"
        textContentType="newPassword"
        error={isPasswordTooShort ? t.auth.passwordTooShort(MIN_PASSWORD_LENGTH) : null}
        returnKeyType="next"
      />
      <TextField
        label={t.auth.confirmPassword}
        password
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        placeholder={t.auth.confirmPasswordPlaceholder}
        autoComplete="new-password"
        textContentType="newPassword"
        error={isConfirmWrong ? t.auth.passwordsDontMatch : null}
        returnKeyType="go"
        onSubmitEditing={canSubmit ? handleSubmit : undefined}
      />

      <Button
        label={t.auth.createAccountButton}
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
