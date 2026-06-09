import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-2xl max-h-[92vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4">
              <p className="text-sm font-semibold text-ink">{title}</p>
              <button
                onClick={onClose}
                className="flex items-center justify-center cursor-pointer focus-visible:outline-none"
              >
                <X size={20} className="text-muted" />
              </button>
            </div>

            {/* Content */}
            <div
              className="px-5"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
