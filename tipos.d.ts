// Migrations do Drizzle, importadas como texto pelo babel-plugin-inline-import.
declare module '*.sql' {
  const conteudo: string;
  export default conteudo;
}

// Folha de estilos do Tailwind/NativeWind, importada só pelo efeito colateral.
declare module '*.css';
