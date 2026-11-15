import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { SegmentedControl } from '@/components/Cards';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import { initials } from '@/utils/format';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const busy = useAuthStore((state) => state.busy);
  const error = useAuthStore((state) => state.error);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const signOut = useAuthStore((state) => state.signOut);
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const updateAvatar = useAuthStore((state) => state.updateAvatar);
  const clearError = useAuthStore((state) => state.clearError);

  const [mode, setMode] = useState<Mode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('🎵');

  const signedIn = status === 'signedIn' && Boolean(user);

  const changeMode = (next: Mode) => {
    setMode(next);
    setLocalError(null);
    clearError();
  };

  const submit = async () => {
    setLocalError(null);
    clearError();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Passwords need at least 8 characters.');
      return;
    }
    if (mode === 'signup' && displayName.trim().length < 2) {
      setLocalError('Tell us what we should call you.');
      return;
    }

    const ok =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, displayName);

    if (ok) {
      toast(mode === 'signin' ? 'Welcome back to NKfy' : 'Your NKfy account is ready', 'success');
      router.back();
    }
  };

  const useDemo = () => {
    setMode('signin');
    setEmail('demo@nkfy.app');
    setPassword('Music1234');
    setLocalError(null);
    clearError();
  };

  const confirmSignOut = () => {
    const proceed = () => {
      void signOut();
      toast('Signed out');
      router.back();
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm('Sign out? Your on-device library and playlists stay on this device.')) {
        proceed();
      }
    } else {
      Alert.alert('Sign out?', 'Your on-device library and playlists stay on this device.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: proceed },
      ]);
    }
  };

  if (signedIn && user) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen>
          <Header
            title="Account"
            onBack={() => router.back()}
            backIcon="chevron-down"
            right={
              <IconButton
                icon="close"
                size={38}
                iconSize={20}
                color={colors.textMuted}
                onPress={() => router.back()}
                accessibilityLabel="Close account"
              />
            }
          />

          <View style={styles.accountCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.isGuest ? (user.avatar ?? '🎵') : initials(user.displayName)}
              </Text>
            </View>
            <Text style={styles.accountName}>{user.displayName}</Text>
            <Text style={styles.accountEmail}>
              {user.isGuest ? 'Guest on this device' : user.email}
            </Text>
            <View style={styles.badge}>
              <Icon name="shield" size={11} color={colors.accentLight} />
              <Text style={styles.badgeText}>
                {user.isGuest ? 'GUEST MODE' : 'SYNCED ACCOUNT'}
              </Text>
            </View>

            <Button
              label={editing ? 'Cancel' : 'Edit profile'}
              icon={editing ? 'close' : 'edit'}
              variant="secondary"
              size="sm"
              onPress={() => {
                if (editing) {
                  setEditing(false);
                } else {
                  setEditName(user.displayName);
                  setEditAvatar(user.avatar ?? '🎵');
                  setEditing(true);
                }
              }}
              style={styles.editButton}
            />
          </View>

          {editing ? (
            <View style={styles.editCard}>
              <View style={styles.field}>
                <Text style={styles.label}>Display name</Text>
                <View style={styles.inputWrap}>
                  <Icon name="user" size={16} color={colors.textMuted} />
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="How should we call you?"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    selectionColor={colors.accent}
                    autoCapitalize="words"
                    maxLength={60}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Avatar</Text>
                <View style={styles.avatarRow}>
                  {['🎵', '🎧', '🎤', '🎸', '🎹', '🥁', '🎷', '🎺', '🪕', '🎼'].map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => setEditAvatar(emoji)}
                      style={[styles.avatarOption, editAvatar === emoji && styles.avatarOptionActive]}
                    >
                      <Text style={styles.avatarOptionText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Button
                label="Save changes"
                icon="check"
                onPress={async () => {
                  let ok = true;
                  if (editName.trim().length >= 2) {
                    ok = await updateDisplayName(editName);
                  }
                  if (user.isGuest && editAvatar) {
                    await updateAvatar(editAvatar);
                  }
                  if (ok) {
                    toast('Profile updated', 'success');
                    setEditing(false);
                  } else {
                    toast('Could not update profile', 'error');
                  }
                }}
                fullWidth
                size="lg"
                style={styles.submit}
              />
            </View>
          ) : null}

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Icon name="mail" size={16} color={colors.accentLight} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Icon name="clock" size={16} color={colors.accentLight} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Member since</Text>
                <Text style={styles.detailValue}>
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Icon name="shield" size={16} color={colors.accentLight} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Cloud backup</Text>
                <Text style={styles.detailValue}>
                  Manage backups from Settings → Cloud backup.
                </Text>
              </View>
            </View>
          </View>

          <Button
            label="Back up & restore"
            icon="shield"
            onPress={() => router.replace('/settings')}
            style={styles.primaryAction}
          />
          <Button
            label="Sign out"
            icon="logout"
            variant="danger"
            onPress={confirmSignOut}
            style={styles.secondaryAction}
          />

          <Text style={styles.privacy}>
            NKfy only stores your account, favorites and playlists on the server. Listening history
            and device files never leave this device.
          </Text>
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen contentContainerStyle={styles.screenContent}>
        <Header
          onBack={() => router.back()}
          backIcon="chevron-down"
          right={
            <IconButton
              icon="close"
              size={38}
              iconSize={20}
              color={colors.textMuted}
              onPress={() => router.back()}
              accessibilityLabel="Close"
            />
          }
        />

        <View style={styles.brand}>
          <View style={styles.logo}>
            <Icon name="logo" size={30} color={colors.white} strokeWidth={2} />
          </View>
          <Text style={styles.wordmark}>NKfy</Text>
          <Text style={styles.tagline}>Feel The Music</Text>
        </View>

        <View style={styles.formCard}>
          <SegmentedControl<Mode>
            value={mode}
            onChange={changeMode}
            options={[
              { value: 'signin', label: 'Sign in' },
              { value: 'signup', label: 'Create account' },
            ]}
          />

          <Text style={styles.formTitle}>
            {mode === 'signin' ? 'Welcome back' : 'Make it yours'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'signin'
              ? 'Pick up your playlists and favorites on any device.'
              : 'Save your library to the cloud and carry it with you.'}
          </Text>

          {mode === 'signup' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Display name</Text>
              <View style={styles.inputWrap}>
                <Icon name="user" size={16} color={colors.textMuted} />
                <TextInput
                  value={displayName}
                  onChangeText={(value) => {
                    setDisplayName(value);
                    setLocalError(null);
                    clearError();
                  }}
                  placeholder="How should we call you?"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  selectionColor={colors.accent}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={60}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Icon name="mail" size={16} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setLocalError(null);
                  clearError();
                }}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                selectionColor={colors.accent}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                maxLength={160}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Icon name="lock" size={16} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setLocalError(null);
                  clearError();
                }}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                selectionColor={colors.accent}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                maxLength={120}
                onSubmitEditing={() => void submit()}
                returnKeyType="go"
              />
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={17}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {localError || error ? (
            <View style={styles.errorBox}>
              <Icon name="info" size={13} color={colors.danger} />
              <Text style={styles.errorText}>{localError ?? error}</Text>
            </View>
          ) : null}

          <Button
            label={mode === 'signin' ? 'Sign in' : 'Create my account'}
            icon={mode === 'signin' ? 'arrow-right' : 'sparkles'}
            onPress={() => void submit()}
            loading={busy}
            disabled={busy}
            fullWidth
            size="lg"
            style={styles.submit}
          />

          <Pressable onPress={useDemo} style={styles.demoLink} hitSlop={8}>
            <Icon name="sparkles" size={13} color={colors.accentLight} />
            <Text style={styles.demoText}>Use the demo account</Text>
          </Pressable>

           <Pressable
             onPress={() => {
               void signInAsGuest().then(() => {
                 toast('Continuing as a guest', 'success');
                 router.back();
               });
             }}
             style={styles.demoLink}
             hitSlop={8}
           >
             <Icon name="profile" size={13} color={colors.accentLight} />
             <Text style={styles.demoText}>Continue as a guest</Text>
           </Pressable>

        </View>

        <View style={styles.trust}>
          <View style={styles.trustRow}>
            <Icon name="shield" size={14} color={colors.textMuted} />
            <Text style={styles.trustText}>
              Passwords are hashed on the server. Tokens live in the device secure store.
            </Text>
          </View>
          <View style={styles.trustRow}>
            <Icon name="smartphone" size={14} color={colors.textMuted} />
            <Text style={styles.trustText}>
              Your local music, listening history and equalizer stay on this device.
            </Text>
          </View>
        </View>

        <Pressable onPress={() => router.back()} style={styles.guest} hitSlop={8}>
          <Text style={styles.guestText}>Continue as a guest</Text>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    paddingBottom: spacing.xxxl,
  },
  brand: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  wordmark: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    letterSpacing: -1,
    color: colors.text,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.accentLight,
  },
  formCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
  },
  formTitle: {
    fontFamily: fonts.bold,
    fontSize: 21,
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: spacing.sm,
  },
  formSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: -6,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginLeft: 2,
  },
  inputWrap: {
    height: 48,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm + 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,92,92,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,92,92,0.26)',
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.text,
  },
  submit: {
    marginTop: spacing.xs,
  },
  demoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.xs,
  },
  demoText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.accentLight,
  },
  trust: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  trustText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textMuted,
  },
  guest: {
    alignSelf: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  guestText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    textDecorationColor: colors.border,
  },
  accountCard: {
    alignItems: 'center',
    gap: 4,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
    overflow: 'hidden',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: 'rgba(47,128,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.accentLight,
    letterSpacing: -0.5,
  },
  accountName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.text,
  },
  accountEmail: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.accentFaint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 0.8,
    color: colors.accentLight,
  },
  detailCard: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  detailCopy: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  detailValue: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
  },
  primaryAction: {
    marginTop: spacing.xl,
  },
  secondaryAction: {
    marginTop: spacing.sm,
  },
  privacy: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  editButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  editCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  avatarOptionText: {
    fontSize: 20,
  },
});
