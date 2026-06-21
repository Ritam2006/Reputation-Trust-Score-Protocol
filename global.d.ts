declare module '*.css' {
  const content: Record<string, any>;
  export default content;
}

declare module '*.css?url' {
  const content: string;
  export default content;
}
