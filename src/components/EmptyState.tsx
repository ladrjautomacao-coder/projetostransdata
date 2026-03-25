import { motion } from "framer-motion";
import { FolderOpen, Users, Package, Search, FileX, Inbox } from "lucide-react";

const iconMap = {
  projects: FolderOpen,
  team: Users,
  products: Package,
  search: Search,
  file: FileX,
  default: Inbox,
};

interface EmptyStateProps {
  type?: keyof typeof iconMap;
  title: string;
  description?: string;
}

export function EmptyState({ type = "default", title, description }: EmptyStateProps) {
  const Icon = iconMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-6">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
        {/* Icon circle */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-lg"
        >
          <Icon className="h-9 w-9 text-muted-foreground/60" />
        </motion.div>
      </div>
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-1"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground max-w-xs text-center"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
