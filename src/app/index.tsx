import { Redirect } from 'expo-router';

/**
 * Temporary entry point while only the foundation exists.
 * Step 3 replaces this with: onboarding if not finished, otherwise the Veni tab.
 */
export default function Index() {
  return <Redirect href="/dev/theme-lab" />;
}
