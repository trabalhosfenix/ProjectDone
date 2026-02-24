import { describe, expect, it } from "vitest";
import { canAccessFeature } from "@/lib/access-scopes";

describe("Tipos de usuário e permissões", () => {
  it("ADMIN sempre acessa funcionalidades", () => {
    expect(canAccessFeature("ADMIN", undefined, "settings")).toBe(true);
    expect(canAccessFeature("ADMIN", { settings: false }, "settings")).toBe(true);
  });

  it("usuário comum depende de permission map explícito", () => {
    const permissions = {
      projetos: true,
      settings: false,
    };

    expect(canAccessFeature("USER", permissions, "projetos")).toBe(true);
    expect(canAccessFeature("USER", permissions, "settings")).toBe(false);
    expect(canAccessFeature("USER", permissions, "kanban")).toBe(false);
  });

  it("sem mapa de permissões, usuário comum não acessa recursos protegidos", () => {
    expect(canAccessFeature("USER", null, "projetos")).toBe(false);
    expect(canAccessFeature(undefined, undefined, "projetos")).toBe(false);
  });
});
