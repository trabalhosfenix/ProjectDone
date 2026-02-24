import { describe, expect, it } from "vitest";
import { buildProjectItemScope, buildProjectScope } from "@/lib/access-scopes";

describe("Isolamento por conta (escopos)", () => {
  it("admin global vê todos os projetos", () => {
    const scope = buildProjectScope({
      id: "admin-global",
      role: "ADMIN",
      tenantId: null,
    });

    expect(scope).toEqual({});
  });

  it("admin de conta fica restrito à própria conta", () => {
    const scope = buildProjectScope({
      id: "admin-conta-a",
      role: "ADMIN",
      tenantId: "conta-a",
    });

    expect(scope).toEqual({ tenantId: "conta-a" });
  });

  it("usuário comum fica restrito à conta e aos projetos em que participa", () => {
    const scope = buildProjectScope({
      id: "user-1",
      role: "USER",
      tenantId: "conta-a",
    });

    expect(scope).toEqual({
      tenantId: "conta-a",
      OR: [
        { createdById: "user-1" },
        { members: { some: { userId: "user-1" } } },
      ],
    });
  });

  it("escopo de itens reutiliza a política de projeto para usuário comum", () => {
    const scope = buildProjectItemScope({
      id: "user-1",
      role: "USER",
      tenantId: "conta-a",
    });

    expect(scope).toEqual({
      tenantId: "conta-a",
      project: {
        is: {
          tenantId: "conta-a",
          OR: [
            { createdById: "user-1" },
            { members: { some: { userId: "user-1" } } },
          ],
        },
      },
    });
  });
});
