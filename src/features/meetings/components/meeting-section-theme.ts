import { BookOpen, Gem, type LucideIcon, Mic, MoonStar, Music, Sunrise, Wheat } from "lucide-react";
import type { ComponentType, CSSProperties, SVGProps } from "react";
import {
  accentBackground,
  accentBorder,
  accentSoftText,
} from "@/features/meetings/components/section-accent";
import { SheepIcon } from "@/features/meetings/components/sheep-icon";
import type { MeetingSection, SectionAccent } from "@/features/meetings/lib/meeting-builder";

type SectionIcon = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

export interface MeetingSectionTheme {
  /** Cor base da identidade visual da seção (hex), misturada com os tokens. */
  color: string;
  Icon: SectionIcon;
}

/**
 * Identidade visual (modo claro) das seções da programação:
 * - Tesouros da Palavra de Deus: azul/ciano (#3c7f8b, diamante)
 * - Faça Seu Melhor no Ministério: âmbar/dourado (#d68f00, trigo)
 * - Nossa Vida Cristã: coral (#bf2f13, ovelha)
 * - Seções neutras (abertura, encerramento e fim de semana): ardósia
 *
 * As cores são combinadas com `color-mix` sobre os tokens (`--card`,
 * `--foreground`), mantendo a página legível em modo claro e compatível
 * com o modo escuro global.
 */
const ACCENT_THEMES: Record<SectionAccent, MeetingSectionTheme> = {
  neutral: { color: "#64748b", Icon: Music },
  treasures: { color: "#3c7f8b", Icon: Gem },
  ministry: { color: "#d68f00", Icon: Wheat },
  living: { color: "#bf2f13", Icon: SheepIcon },
};

/** Ícone específico por id de seção (ex.: partes do fim de semana). */
const SECTION_ICONS: Record<string, SectionIcon> = {
  initial: Sunrise,
  final: MoonStar,
  "weekend-initial": Sunrise,
  "weekend-talk-section": Mic,
  "weekend-middle": Music,
  "weekend-watchtower-section": BookOpen,
  "weekend-final-talk-section": Mic,
  "weekend-final": MoonStar,
};

export function getMeetingSectionTheme(
  section: Pick<MeetingSection, "id" | "accent">,
): MeetingSectionTheme {
  const base = ACCENT_THEMES[section.accent];
  return { ...base, Icon: SECTION_ICONS[section.id] ?? base.Icon };
}

function mixWith(color: string, percent: number, against: string): string {
  return `color-mix(in srgb, ${color} ${percent}%, ${against})`;
}

/** Fundo tonalizado do bloco da seção + borda temática sutil. */
export function sectionSurfaceStyle(theme: MeetingSectionTheme): CSSProperties {
  return {
    backgroundColor: accentBackground(theme.color),
    borderColor: accentBorder(theme.color),
  };
}

/** Cor intensa do título da seção, com contraste sobre fundo claro. */
export function sectionTitleStyle(theme: MeetingSectionTheme): CSSProperties {
  return { color: accentSoftText(theme.color) };
}

/** Pílula (chip) temática: totais, horários e rótulos curtos. */
export function sectionChipStyle(theme: MeetingSectionTheme): CSSProperties {
  return {
    backgroundColor: mixWith(theme.color, 12, "transparent"),
    color: accentSoftText(theme.color),
  };
}

/** Cápsula de horário das linhas da programação. */
export function timeCapsuleStyle(theme: MeetingSectionTheme): CSSProperties {
  return {
    backgroundColor: mixWith(theme.color, 13, "var(--card)"),
    color: accentSoftText(theme.color),
  };
}

/** Variável CSS usada pelos divisores internos (`divide-[var(--section-divider)]`). */
export function sectionDividerVar(theme: MeetingSectionTheme): CSSProperties {
  return {
    "--section-divider": mixWith(theme.color, 20, "transparent"),
  } as CSSProperties;
}
