'use client';

export type Agent = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  color: string;
  isDefault?: boolean;
  sessionId: string;
  avatar?: string;
};

type AgentPanelProps = {
  agents: Agent[];
  activeAgentId: string;
  onSelect: (agentId: string) => void;
  onAddAgent: () => void;
};

export default function AgentPanel({ agents, activeAgentId, onSelect, onAddAgent }: AgentPanelProps) {
  return (
    <aside className="hidden md:flex md:w-72 md:flex-col border-r border-gray-800 bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold tracking-wide text-gray-200">Agents</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {agents.map((agent) => {
          const active = agent.id === activeAgentId;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-gray-600 bg-gray-800/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                  : 'border-transparent bg-transparent hover:border-gray-700 hover:bg-gray-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-base overflow-hidden" style={{ backgroundColor: agent.color }}>
                  {agent.avatar
                    ? <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover rounded-full" />
                    : agent.emoji}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-100">{agent.name}</div>
                  <div className="truncate text-xs text-gray-400">{agent.role}</div>
                </div>
                {active && <div className="ml-auto h-2.5 w-2.5 rounded-full" style={{ backgroundColor: agent.color }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={onAddAgent}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-700"
        >
          + Add Agent
        </button>
      </div>
    </aside>
  );
}
