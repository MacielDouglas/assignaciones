import { Gem, type LucideIcon, Wheat } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { SheepIcon } from "@/features/meetings/components/sheep-icon";
import type { SectionAccent } from "@/features/meetings/lib/meeting-builder";

interface AccentTheme {
  color: string;
  Icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * Identidade visual das seções principais da reunião:
 * - Tesouros da Palavra de Deus: #3c7f8b (diamante)
 * - Faça Seu Melhor no Ministério: #d68f00 (ramo de trigo)
 * - Nossa Vida Cristã: #bf2f13 (ovelha)
 */
export const SECTION_ACCENTS: Record<Exclude<SectionAccent, "neutral">, AccentTheme> = {
  treasures: { color: "#3c7f8b", Icon: Gem },
  ministry: { color: "#d68f00", Icon: Wheat },
  living: { color: "#bf2f13", Icon: SheepIcon },
};

export function accentBackground(color: string): string {
  return `color-mix(in srgb, ${color} 8%, var(--card))`;
}

export function accentBorder(color: string): string {
  return `color-mix(in srgb, ${color} 28%, transparent)`;
}

export function accentSoftText(color: string): string {
  return `color-mix(in srgb, ${color} 82%, var(--foreground))`;
}
