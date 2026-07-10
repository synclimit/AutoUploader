import React from 'react';
import { Database, SearchX, AlertTriangle, Loader2, WifiOff, Lock } from 'lucide-react';

export default function EmptyState({ type, message }) {
  let config = {
    icon: Database,
    title: 'No Data',
    desc: 'There are no journal entries to display.',
    color: 'text-white/20'
  };

  switch (type) {
    case 'LOADING':
      config = { icon: Loader2, title: 'Loading Journal...', desc: 'Retrieving execution records.', color: 'text-cyan-500 animate-spin' };
      break;
    case 'EMPTY':
      config = { icon: Database, title: 'No Executions Yet', desc: 'No upload executions have been recorded for this view.', color: 'text-white/20' };
      break;
    case 'NO_RESULT':
      config = { icon: SearchX, title: 'No Results Found', desc: 'No records match your search or filter criteria.', color: 'text-white/20' };
      break;
    case 'OFFLINE':
      config = { icon: WifiOff, title: 'Offline', desc: 'Cannot connect to the server.', color: 'text-red-500' };
      break;
    case 'ERROR':
      config = { icon: AlertTriangle, title: 'Backend Error', desc: message || 'An error occurred while fetching journal data.', color: 'text-red-500' };
      break;
    case '403':
      config = { icon: Lock, title: 'Unauthorized', desc: 'You do not have permission to view this journal.', color: 'text-yellow-500' };
      break;
    default:
      break;
  }

  const Icon = config.icon;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#050505]">
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 ${config.color}`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-white">{config.title}</h3>
      <p className="max-w-[300px] text-[13px] text-white/50">{config.desc}</p>
    </div>
  );
}
