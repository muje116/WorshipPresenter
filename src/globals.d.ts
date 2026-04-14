// Global type declarations
declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module '*.html' {
  const content: string
  export default content
}
