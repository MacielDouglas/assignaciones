import type { SVGProps } from "react";

/**
 * Ícone de ovelha (seção "Nossa Vida Cristã"), no estilo dos ícones
 * das apostilas. Silhueta preenchida com olhos vazados para funcionar
 * sobre qualquer cor de fundo.
 */
export function SheepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <g fill="currentColor">
        <circle cx="8" cy="10" r="3.1" />
        <circle cx="11.5" cy="8.4" r="3.4" />
        <circle cx="15" cy="9.6" r="2.9" />
        <circle cx="13" cy="11.8" r="3.1" />
        <circle cx="9" cy="12.6" r="2.7" />
        <circle cx="12.4" cy="13.6" r="2.5" />
      </g>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.6 10.2h.9a2.3 2.3 0 0 1 2.3 2.3v1a2.3 2.3 0 0 1-2.3 2.3h-.9a2.3 2.3 0 0 1-2.3-2.3v-1a2.3 2.3 0 0 1 2.3-2.3Zm-.75 1.35a.68.68 0 1 0 0 1.36.68.68 0 0 0 0-1.36Zm2.4 0a.68.68 0 1 0 0 1.36.68.68 0 0 0 0-1.36Z"
      />
      <path
        d="M14.3 10.6c-.8-.9-.5-2 .3-2.5M20 10.9c.8-.7.7-1.9 0-2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.6 15.6v3.2M13 16v2.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
