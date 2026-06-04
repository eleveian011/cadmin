// Data/service layer for the demo build.
// Pages consume the React Query hooks in ./hooks, which delegate to ./store
// (an in-memory data source). To integrate a real backend, replace the function
// bodies in ./store.ts with fetch() calls — hooks and pages need no changes.
export * from './hooks'
