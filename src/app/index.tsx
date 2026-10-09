import { Redirect } from 'expo-router';

/**
 * Entry point. Step 8 adds the check: onboarding until it's finished, then Veni.
 */
export default function Index() {
  return <Redirect href="/veni" />;
}
