'use client';
import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { mockTasks } from '@/lib/mock-data';

type Status = 'todo' | 'inprogress' | 'review' | 'done';
const columns: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#888' },
  { id: 'inprogress', label: 'In Progress', color: '#6366f1' },
  { id: 'review', label: 'Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

export default function TasksPage() {
  interface Task { id: string; title: string; description: string; project: string; priority: string; status: Status; dueDate: string; }
  const [tasks, setTasks] = useState<Task[]>(mockTasks as unknown as Task[]);
  const [dragging, setDragging] = useState<string | null>(null);

  const onDragStart = (id: string) => setDragging(id);
  const onDrop = (status: Status) => {
    if (!dragging) return;
    setTasks(t => t.map(task => task.id === dragging ? { ...task, status } : task));
    setDragging(null);
  };

  return (
    <div>
      <TopBar title="Tasks" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(col.id)}
                style={{ minWidth: 260, flex: '0 0 260px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{col.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 4 }}>
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(task.id)}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', cursor: 'grab', opacity: dragging === task.id ? 0.5 : 1 }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#e5e5e5', marginBottom: 6, lineHeight: 1.4 }}>{task.title}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{task.project}</span>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#888', background: task.priority === 'high' ? 'rgba(239,68,68,0.1)' : task.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'transparent' }}>{task.priority}</span>
                      </div>
                      {task.dueDate && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Due {task.dueDate}</div>}
                    </div>
                  ))}
                  <button style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>+ Add task</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
