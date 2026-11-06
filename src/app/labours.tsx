import { Redirect } from 'expo-router';

/**
 * Labours became Quests on 2 Nov and live in the Shop's Earn tab, so there is one board. Old
 * links to /labours open it there.
 */
export default function LaboursRedirect() {
  return <Redirect href={{ pathname: '/shop', params: { tab: 'earn' } }} />;
}
