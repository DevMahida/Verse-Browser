import React, { useState, useEffect, useCallback } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { Server, Plus, Trash2, Power, PowerOff, RefreshCw } from 'lucide-react';

export default function MCPSettings() {
  const { mcpServers, setMcpServers } = useBrowserStore();
  const [loading, setLoading] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerCommand, setNewServerCommand] = useState('npx');
  const [newServerArgs, setNewServerArgs] = useState('-y @modelcontextprotocol/server-filesystem D:/');

  const fetchServers = useCallback(async () => {
    if (!window.electron?.mcpClient) return;
    setLoading(true);
    try {
      const servers = await window.electron.mcpClient.listServers();
      setMcpServers(servers);
    } catch (e) {
      console.error('Failed to fetch MCP servers', e);
    } finally {
      setLoading(false);
    }
  }, [setMcpServers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchServers();
  }, [fetchServers]);

  const handleToggle = async (name, enabled) => {
    if (!window.electron?.mcpClient) return;
    try {
      await window.electron.mcpClient.toggleServer(name, !enabled);
      fetchServers();
    } catch (e) {
      console.error('Failed to toggle server', e);
    }
  };

  const handleRemove = async (name) => {
    if (!window.electron?.mcpClient) return;
    try {
      await window.electron.mcpClient.removeServer(name);
      fetchServers();
    } catch (e) {
      console.error('Failed to remove server', e);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!window.electron?.mcpClient || !newServerName || !newServerCommand) return;
    
    const config = {
      command: newServerCommand,
      args: newServerArgs.split(' ').filter(a => a),
      enabled: true
    };
    
    try {
      await window.electron.mcpClient.addServer(newServerName, config);
      setNewServerName('');
      setNewServerArgs('');
      fetchServers();
    } catch (e) {
      console.error('Failed to add server', e);
    }
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between border-b border-border mb-4 pb-2">
        <h2 className="text-lg font-medium text-foreground/90 flex items-center gap-2">
          <Server size={20} className="text-blue-500" /> Model Context Protocol (MCP)
        </h2>
        <button 
          onClick={fetchServers} 
          disabled={loading}
          className="text-xs flex items-center gap-1 text-foreground/60 hover:text-foreground cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm text-foreground/70 mb-4">
            Connect external tools (like local filesystem or databases) to the AI assistant using MCP.
          </p>

          <form onSubmit={handleAdd} className="flex flex-col gap-3 p-4 bg-background border border-border rounded-lg">
            <h3 className="text-sm font-medium text-foreground">Add New Server</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Name (e.g. filesystem)" 
                value={newServerName}
                onChange={e => setNewServerName(e.target.value)}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <input 
                type="text" 
                placeholder="Command (e.g. npx)" 
                value={newServerCommand}
                onChange={e => setNewServerCommand(e.target.value)}
                className="w-24 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <input 
                type="text" 
                placeholder="Args (space separated)" 
                value={newServerArgs}
                onChange={e => setNewServerArgs(e.target.value)}
                className="flex-[2] bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </form>
        </div>
        
        <div className="divide-y divide-border bg-background">
          {mcpServers.length === 0 ? (
            <div className="p-6 text-center text-sm text-foreground/50">No MCP servers configured.</div>
          ) : (
            mcpServers.map(server => (
              <div key={server.name} className="p-4 flex items-center justify-between hover:bg-foreground/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${server.status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{server.name}</h3>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {server.command} {server.args?.join(' ')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-xs text-foreground/60 bg-surface px-2 py-1 rounded-md border border-border">
                    {server.toolCount || 0} tools
                  </div>
                  
                  <button 
                    onClick={() => handleToggle(server.name, server.enabled)}
                    title={server.enabled ? "Disable server" : "Enable server"}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${server.enabled ? 'text-green-500 hover:bg-green-500/10' : 'text-foreground/40 hover:bg-foreground/10 hover:text-foreground'}`}
                  >
                    {server.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                  </button>
                  
                  <button 
                    onClick={() => handleRemove(server.name)}
                    title="Remove server"
                    className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
