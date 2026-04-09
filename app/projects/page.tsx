import TopBar from '@/components/TopBar';
import { mockProjects } from '@/lib/mock-data';

const categories = ['EMS Leadership', 'Wealth Building', 'Personal'];

export default function ProjectsPage() {
  return (
    <div>
      <TopBar title="Projects" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{mockProjects.length} active projects across {categories.length} categories</p>
          <button style={{ background: 'var(--primary)', border: 'none', borderRadius: 7, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ New Project</button>
        </div>

        {categories.map(cat => {
          const projects = mockProjects.filter(p => p.category === cat);
          if (!projects.length) return null;
          return (
            <div key={cat} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>{cat}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {projects.map(p => (
                  <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, marginTop: 4 }} />
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 500 }}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.4 }}>{p.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>📋 {p.tasksCount} tasks</span>
                      <span>Updated {p.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
