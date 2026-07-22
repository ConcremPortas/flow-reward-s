/** Rodapé centralizado do Hub. Ano dinâmico; "Concrem" em verde. */
export function HubFooter() {
  const ano = new Date().getFullYear();
  return (
    <footer className="pb-6 text-center">
      <p className="text-sm text-white/45">
        © {ano} <span className="text-emerald-400">Concrem</span>. Todos os direitos reservados.
      </p>
    </footer>
  );
}
