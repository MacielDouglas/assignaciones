export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Asignaciones. Todos os direitos reservados.</p>
        <p>Feito para atribuições de equipe</p>
      </div>
    </footer>
  );
}
