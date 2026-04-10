'use client';

import type { Agent } from '@/components/AgentPanel';

type AgentSwitcherProps = {
  agents: Agent[];
  activeAgentId: string;
  onSelect: (agentId: string) => void;
};

export default function AgentSwitcher({ agents, activeAgentId, onSelect }: AgentSwitcherProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900/95 px-4 py-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {agents.map((agent) => {
          const active = agent.id === activeAgentId;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={`min-w-20 rounded-xl border px-3 py-2 text-center transition ${
                active ? 'border-gray-500 bg-gray-800 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]' : 'border-gray-800 bg-gray-800/60 hover:border-gray-700'
              }`}
            >
              <div
                className={`mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full text-base ${
                  active ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-indigo-400' : ''
                }`}
                style={{ backgroundColor: agent.color, boxShadow: active ? `0 0 14px ${agent.color}` : undefined }}
              >
                {agent.emoji}
              </div>
              <div className="text-xs font-medium text-gray-200">{agent.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
