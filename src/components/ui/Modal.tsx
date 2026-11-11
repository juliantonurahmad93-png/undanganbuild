import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "../../utils/cn";

export function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-md",
  bare = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  bare?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="Tutup"
            className="fixed inset-0 cursor-default bg-inverse-surface/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="flex min-h-full items-start justify-center p-4 pt-10 sm:items-center sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 36, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "relative my-2 w-full",
                maxWidth,
                !bare && "overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl",
              )}
            >
              {!bare && (
                <button
                  onClick={onClose}
                  aria-label="Tutup dialog"
                  className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container-high sm:right-4 sm:top-4"
                >
                  <X size={16} />
                </button>
              )}
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
