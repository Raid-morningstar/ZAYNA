import {
  BadgePercent,
  Droplets,
  Gem,
  HeartPulse,
  LucideIcon,
  Package,
  Pill,
  ShieldCheck,
  Sparkles,
  Sun,
  Tag,
  UserRound,
  WandSparkles,
} from "lucide-react";

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const categoryIconRules: Array<{ keywords: string[]; icon: LucideIcon }> = [
  { keywords: ["soin", "skin", "peau", "visage"], icon: Sparkles },
  { keywords: ["cheveux", "hair", "capillaire", "shampo"], icon: Droplets },
  { keywords: ["parfum", "fragrance", "eau de parfum"], icon: Gem },
  { keywords: ["maquillage", "makeup", "rouge", "fond de teint"], icon: WandSparkles },
  { keywords: ["homme", "men", "barbe"], icon: UserRound },
  { keywords: ["femme", "women", "lady"], icon: HeartPulse },
  { keywords: ["solaire", "sun", "spf"], icon: Sun },
  { keywords: ["hygiene", "savon", "gel douche"], icon: ShieldCheck },
  { keywords: ["sante", "vitamine", "complement"], icon: Pill },
  { keywords: ["promo", "promotion", "offre", "reduction"], icon: BadgePercent },
];

export const getCategoryIcon = (title: string): LucideIcon => {
  const normalizedTitle = normalizeText(title || "");
  const rule = categoryIconRules.find(({ keywords }) =>
    keywords.some((keyword) => normalizedTitle.includes(keyword))
  );

  if (rule) return rule.icon;
  if (normalizedTitle.includes("beaute")) return Sparkles;
  if (normalizedTitle.includes("bien-etre")) return HeartPulse;
  if (normalizedTitle.includes("accessoire")) return Tag;

  return Package;
};

