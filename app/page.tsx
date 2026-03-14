export default function HomePage() {
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe 
        src="https://v0-project-debugging-virid.vercel.app"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="iCore Platform"
      />
    </div>
  )
}
