import { StyleSheet, Platform } from 'react-native';
import { spacing, fontSizes } from '../../../theme/theme.js';

// Constants for header and tab bar dimensions
export const HEADER_HEIGHT = 250;
export const TAB_BAR_HEIGHT = 60;
export const STICKY_HEADER_HEIGHT = TAB_BAR_HEIGHT;
export const HEADER_TITLE_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'inherit', // Will be set dynamically
  },

  // Header styles
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 0,
    height: HEADER_HEIGHT,
  },
  headerImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: HEADER_HEIGHT,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  headerTitleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 0,
    right: 0,
    height: HEADER_TITLE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Group Info Card
  groupInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  groupInfoCard: {
    padding: spacing.lg,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  groupInfoHeader: {
    marginBottom: spacing.md,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  groupStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 16,
  },
  groupStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  groupStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupStatLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  groupStatDivider: {
    width: 1,
    height: 40,
    opacity: 0.2,
  },
  groupMembersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  membersTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  groupsText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
    opacity: 0.8,
  },
  memberArrow: {
    marginLeft: spacing.xs,
  },

  // Tab styles
  tabBarContainer: {
    width: '100%',
    zIndex: 10,
  },
  tabBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Content styles
  tabContent: {
    flex: 1,
  },
  expensesContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  balancesContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  expenseCardContainer: {
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
    opacity: 0.7,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 30,
    marginTop: spacing.md,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Balance item styles
  balanceItem: {
    flexDirection: 'column',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
  },
  balanceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userAvatarText: {
    color: 'white',
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  userTextContainer: {
    marginLeft: spacing.md,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 13,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  balanceText: {
    fontWeight: 'bold',
    fontSize: 18,
  },

  // Section header styles
  sectionHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Payments styles
  paymentsContainer: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra padding for FAB
  },
  paymentItem: {
    borderRadius: 16,
    marginBottom: spacing.md,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  paymentUsers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentUserContainer: {
    alignItems: 'center',
  },
  paymentUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  paymentUserAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentUserAvatarText: {
    color: 'white',
    fontSize: fontSizes.md,
    fontWeight: 'bold',
  },
  paymentUserName: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  paymentArrow: {
    marginHorizontal: spacing.sm,
  },
  paymentAmount: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  paymentFooter: {
    marginTop: spacing.md,
  },
  paymentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: 13,
  },
  paymentStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentNote: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontStyle: 'italic',
  },
  statusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  actionButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },

  // Add button styles
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    zIndex: 10,
  },
  addButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addButtonIcon: {
    fontSize: 30,
  },

  // Scroll view content
  scrollViewContent: {
    flexGrow: 1,
  },

  // Balance Summary Cards
  balanceSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  balanceSummaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceSummaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceSummaryContent: {
    alignItems: 'center',
    width: '100%',
  },
  balanceSummaryLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  balanceSummaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  balanceSummaryCount: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  balanceSummarySubtext: {
    fontSize: 10,
    marginTop: spacing.xs / 2,
    fontStyle: 'italic',
  },

  // Settlement Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  settlementModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  settlementModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  settlementModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  settlementUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settlementUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.lg,
  },
  settlementUserAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  settlementUserAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  settlementUserDetails: {
    flex: 1,
  },
  settlementUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  settlementBalanceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  settlementBalanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settlementInstructions: {
    padding: spacing.lg,
  },
  settlementInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  settlementCard: {
    padding: spacing.lg,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settlementCardIcon: {
    marginRight: spacing.md,
  },
  settlementCardText: {
    fontSize: 16,
    flex: 1,
  },
  settlementNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  settlementActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: 0,
  },
  settlementActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  settlementActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Header gradient
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
});

export default styles;
