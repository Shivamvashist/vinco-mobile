import { Redirect } from 'expo-router';

/**
 * The Shop was called the Forum until 2 Nov. Old links (a notification, a saved deep link such as
 * vinco://forum) land on the Shop.
 */
export default function ForumRedirect() {
  return <Redirect href="/shop" />;
}
