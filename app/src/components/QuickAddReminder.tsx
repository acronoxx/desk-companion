import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type QuickAddReminderProps = {
  /** Called with the trimmed title. The field is cleared once the promise resolves. */
  onAdd: (title: string) => Promise<void>;
};

/** Title limit of the reminders table (1 to 50 characters). */
const MAX_TITLE_LENGTH = 50;

/** A one-line field to add a reminder by its title only. */
export default function QuickAddReminder({ onAdd }: QuickAddReminderProps) {
  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const trimmed = title.trim();
  const canAdd = trimmed !== '' && !isAdding;

  const handleAdd = async () => {
    if (!canAdd) return;
    setIsAdding(true);
    try {
      await onAdd(trimmed);
      setTitle('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.bar}>
      <Feather name="plus" size={20} color={Colors.teal} style={styles.icon} />
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Add a reminder…"
        placeholderTextColor={Colors.textLight}
        maxLength={MAX_TITLE_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
        accessibilityLabel="New reminder title"
        style={styles.input}
      />
      <Pressable
        onPress={handleAdd}
        disabled={!canAdd}
        accessibilityRole="button"
        accessibilityLabel="Add the reminder"
        style={({ pressed }) => [styles.button, !canAdd && styles.buttonDisabled, pressed && styles.buttonPressed]}
      >
        <Feather name="arrow-up" size={20} color={Colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    boxShadow: `4px 4px 0 ${Colors.line}`,
  },
  icon: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
    borderColor: Colors.textLight,
  },
  buttonPressed: {
    backgroundColor: Colors.yellowDark,
  },
});
