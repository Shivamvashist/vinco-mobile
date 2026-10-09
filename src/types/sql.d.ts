/** Drizzle migration files are inlined into the bundle as strings (babel-plugin-inline-import). */
declare module '*.sql' {
  const sql: string;
  export default sql;
}
