import TopBar from '@/components/TopBar';

const files = [
  { name: 'SentinelQA', type: 'folder', size: '-', modified: '2026-04-09' },
  { name: 'APEx360', type: 'folder', size: '-', modified: '2026-04-08' },
  { name: 'Lt-Orientation-May2026.docx', type: 'doc', size: '48 KB', modified: '2026-04-09' },
  { name: 'CARES-Q1-2026.csv', type: 'csv', size: '214 KB', modified: '2026-04-07' },
  { name: 'Assemble-Roadmap.pdf', type: 'pdf', size: '1.2 MB', modified: '2026-04-06' },
  { name: 'ProficiencyAI-Pitch.pdf', type: 'pdf', size: '3.4 MB', modified: '2026-04-05' },
];

const icons: Record<string, string> = { folder: '📁', doc: '📄', csv: '📊', pdf: '📋', default: '📄' };

export default function FilesPage() {
  return (
    <div>
      <TopBar title="Files" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button style={{ background: 'var(--primary)', border: 'none', borderRadius: 7, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>↑ Upload</button>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Size', 'Modified'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={f.name} style={{ borderBottom: i < files.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{icons[f.type] || icons.default}</span>
                      <span style={{ fontSize: 14, color: '#e5e5e5' }}>{f.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{f.size}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{f.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
