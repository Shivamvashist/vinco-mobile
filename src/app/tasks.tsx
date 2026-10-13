import { Redirect } from 'expo-router';

/** The to-do list now lives on "Orders and to-dos" (/plan), To-do tab. Kept so old links still work. */
export default function TasksScreen() {
  return <Redirect href={{ pathname: '/plan', params: { tab: 'todo' } }} />;
}
