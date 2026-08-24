import { MeetingPartRow } from "@/features/meetings/components/meeting-part-row";
import {
  getMeetingSectionTheme,
  sectionChipStyle,
  sectionSurfaceStyle,
  sectionTitleStyle,
} from "@/features/meetings/components/meeting-section-theme";
import type { MeetingSection } from "@/features/meetings/lib/meeting-builder";

/**
 * Bloco colorido de uma seção da programação: cabeçalho com ícone grande
 * em coluna temática e linhas internas compactas sobre fundo claro.
 *
 * Server component — apenas apresentação dos dados já resolvidos no servidor.
 */
export function MeetingSectionBlock({
  section,
  assignments,
}: {
  section: MeetingSection;
  assignments?: Record<string, string>;
}) {
  const theme = getMeetingSectionTheme(section);
  const { Icon } = theme;
  const headingId = `meeting-section-${section.id}`;

  return (
    <li>
      <section
        aria-labelledby={headingId}
        className="overflow-hidden rounded-2xl border"
        style={sectionSurfaceStyle(theme)}
      >
        <header className="flex items-center gap-3 px-3 py-3 sm:px-4">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm sm:size-[3.25rem]"
            style={{ backgroundColor: theme.color }}
          >
            <Icon className="size-6 text-white sm:size-7" aria-hidden="true" />
          </span>
          <h3
            id={headingId}
            className="min-w-0 flex-1 text-sm leading-tight font-extrabold tracking-wide uppercase text-balance sm:text-base"
            style={sectionTitleStyle(theme)}
          >
            {section.title}
          </h3>
          {section.subtitle && (
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
              style={sectionChipStyle(theme)}
            >
              {section.subtitle}
            </span>
          )}
        </header>

        <ol className="divide-y divide-[color:var(--section-divider)] bg-card">
          {section.parts.map((part) => (
            <MeetingPartRow key={part.id} part={part} assignments={assignments} theme={theme} />
          ))}
        </ol>
      </section>
    </li>
  );
}
