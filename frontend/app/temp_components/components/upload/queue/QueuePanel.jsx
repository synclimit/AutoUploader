import UploadHeader from '../layout/UploadHeader'
import QueueCard from './QueueCard'
import { useUploadStore } from '../../../store/upload/uploadStore'


export default function QueuePanel() {

  const queue = useUploadStore((s) => s.queue)


  return (

    <div className="flex-1 min-w-0 bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">

      <UploadHeader />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {queue.map((item, index) => (

          <QueueCard key={item.id} item={item} isActive={index === 0} />

        ))}

      </div>

    </div>

  )

}
