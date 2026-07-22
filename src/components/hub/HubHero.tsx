/**
 * Bloco central do Hub: título, subtítulo e o pequeno detalhe verde. Textos
 * fixos conforme a referência (não usa o texto secundário antigo).
 */
export function HubHero() {
  return (
    <div className="animate-fade-in-up text-center motion-reduce:animate-none">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Bem-vindo ao Hub de Aplicações
      </h1>
      <p className="mt-4 text-lg text-white/60 sm:text-xl">Selecione o módulo que deseja acessar</p>
      <span className="mx-auto mt-6 block h-0.5 w-12 rounded-full bg-emerald-500" aria-hidden />
    </div>
  );
}
