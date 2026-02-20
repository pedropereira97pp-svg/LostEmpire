import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { authService } from '../services';
import type { RootStackScreenProps } from '../navigation';

type Props = RootStackScreenProps<'InGameOverview'>;

interface PlayerStats {
  level: number;
  experience: number;
  gold: number;
  gems: number;
  wins: number;
  losses: number;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface RecentActivity {
  id: string;
  type: 'battle' | 'quest' | 'achievement';
  description: string;
  timestamp: string;
}

export default function InGameOverviewScreen({ navigation }: Props) {
  const [username, setUsername] = useState<string>('');
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    experience: 0,
    gold: 100,
    gems: 10,
    wins: 0,
    losses: 0,
  });
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Health Potion', quantity: 5, rarity: 'common' },
    { id: '2', name: 'Mana Crystal', quantity: 2, rarity: 'rare' },
    { id: '3', name: 'Lucky Charm', quantity: 1, rarity: 'epic' },
  ]);
  const [activities, setActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'achievement',
      description: 'Welcome to Lost Empire!',
      timestamp: 'Just now',
    },
    {
      id: '2',
      type: 'quest',
      description: 'Tutorial completed',
      timestamp: '2 hours ago',
    },
  ]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        await authService.signOut();
        navigation.replace('Login');
        return;
      }
      setUsername(user.username || 'Commander');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return colors.textSecondary;
      case 'rare':
        return '#3B82F6';
      case 'epic':
        return '#8B5CF6';
      case 'legendary':
        return '#F59E0B';
      default:
        return colors.textSecondary;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'battle':
        return '⚔️';
      case 'quest':
        return '📜';
      case 'achievement':
        return '🏆';
      default:
        return '📌';
    }
  };

  const getPlayerTag = (username?: string): string => {
    if (!username) {
      return 'Guest';
    }

    // If username is already short enough, use it as-is
    if (username.length <= 8) {
      return username;
    }

    // Otherwise, truncate and add indicator
    return `${username.substring(0, 8)}...`;
  };

  const handleSignOut = async () => {
    await authService.signOut();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.playerTag}>{getPlayerTag(username)}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={handleSignOut}>
            <Text style={styles.avatarText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Level</Text>
          <Text style={styles.statValue}>{stats.level}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Gold</Text>
          <Text style={[styles.statValue, styles.goldValue]}>{stats.gold}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Gems</Text>
          <Text style={[styles.statValue, styles.gemValue]}>{stats.gems}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>XP</Text>
          <Text style={styles.statValue}>{stats.experience}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Battle Record</Text>
        <View style={styles.recordRow}>
          <View style={styles.recordCard}>
            <Text style={styles.recordLabel}>Wins</Text>
            <Text style={[styles.recordValue, styles.winValue]}>{stats.wins}</Text>
          </View>
          <View style={styles.recordCard}>
            <Text style={styles.recordLabel}>Losses</Text>
            <Text style={[styles.recordValue, styles.lossValue]}>{stats.losses}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        {inventory.map((item) => (
          <View key={item.id} style={styles.inventoryItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text
                style={[
                  styles.itemRarity,
                  { color: getRarityColor(item.rarity) },
                ]}
              >
                {item.rarity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Start Battle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            View Quests
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Connected to Supabase
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: typography.md,
    color: colors.textSecondary,
  },
  username: {
    fontSize: typography.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  playerTag: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  goldValue: {
    color: '#F59E0B',
  },
  gemValue: {
    color: '#3B82F6',
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  recordCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recordValue: {
    fontSize: typography.xxl,
    fontWeight: 'bold',
  },
  winValue: {
    color: colors.success,
  },
  lossValue: {
    color: colors.error,
  },
  inventoryItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemRarity: {
    fontSize: typography.sm,
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: typography.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  activityTimestamp: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  actions: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: typography.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  note: {
    padding: spacing.lg,
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  noteText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
