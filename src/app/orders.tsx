import { Redirect } from 'expo-router';

/** Your orders now live on "Orders and to-dos" (/plan), Orders tab. Kept so old links still work. */
export default function OrdersScreen() {
  return <Redirect href={{ pathname: '/plan', params: { tab: 'orders' } }} />;
}
