import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Teste de sanidade da Etapa 1: valida apenas que o ambiente de testes
// (Vitest + jsdom + Testing Library) está funcionando. NÃO testa regra de negócio.
describe("sanidade do ambiente de testes", () => {
  it("executa asserções básicas", () => {
    expect(1 + 1).toBe(2);
  });

  it("renderiza um componente React via Testing Library", () => {
    render(<div role="status">ConcremRH V2</div>);
    expect(screen.getByRole("status").textContent).toBe("ConcremRH V2");
  });
});
