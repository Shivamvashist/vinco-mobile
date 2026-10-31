/**
 * In-app notices: the API callable from anywhere. The host component is imported from its own
 * file (NoticeHost) by the root layout and BottomSheet.
 */
export { clearNotices, dismissNotice, notify } from './notices';
export type { NoticeAction, NoticeInput, NoticeKind } from '@/features/notices';
