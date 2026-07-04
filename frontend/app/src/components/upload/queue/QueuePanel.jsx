import { useEffect } from 'react'
import UploadHeader from '../layout/UploadHeader'
import QueueCard from './QueueCard'
import { useQueueStore } from '../../../store/upload/uploadStore'
import { pollingManager } from '../../../store/pollingManager'

export default function QueuePanel() {
  const tasks = useQueueStore((s) => s.tasks)
  const fetchTasks = useQueueStore((s) => s.fetchTasks)
  const activeTask = useQueueStore((s) => s.activeTask)
  const setActiveTask = useQueueStore((s) => s.setActiveTask)

  useEffect(() => {
    pollingManager.start('queue-tasks', fetchTasks, 5000)
    return () => pollingManager.stop('queue-tasks')
  }, [fetchTasks])
  return (

    <div className="flex-1 min-w-0 bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">

      <UploadHeader />

      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2">

        {tasks.map((item, index) => (
          <QueueCard key={item.id} item={item} isActive={activeTask?.id === item.id} onClick={() => setActiveTask(item)} />
        ))}

      </div>

    </div>

  )

}
