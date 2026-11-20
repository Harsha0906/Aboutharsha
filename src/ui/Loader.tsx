import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'

export default function Loader({ done }: { done: boolean }) {
  const { progress } = useProgress()
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="loader" exit={{ opacity: 0, filter: 'blur(12px)' }} transition={{ duration: 0.9 }}>
          <div className="loader-name">Harsha</div>
          <div className="loader-bar">
            <i style={{ transform: `scaleX(${Math.max(0.05, progress / 100)})` }} />
          </div>
          <div className="loader-pct">{Math.round(progress)}%</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
