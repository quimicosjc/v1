// Página inicial — em construção
// Esta página será substituída pela home completa na Fase 5
export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#65172A',
        color: '#fff',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '0.5rem' }}>
        Sindicato dos Químicos de SJC e Região
      </p>
      <h1 style={{ fontSize: '2rem', margin: '0 0 1rem' }}>
        Site em construção
      </h1>
      <p style={{ opacity: 0.75, maxWidth: '400px', lineHeight: 1.6 }}>
        O novo site está sendo preparado com mais qualidade e segurança.
        Em breve estará disponível.
      </p>
    </main>
  )
}
