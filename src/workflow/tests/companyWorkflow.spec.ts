import { CompanyWorkflow, defaultCompanyTeam } from '../companyWorkflow';

describe('CompanyWorkflow', () => {
  it('deve gerar eventos para todos os papéis no fluxo', () => {
    const workflow = new CompanyWorkflow(defaultCompanyTeam);
    const result = workflow.runReleaseFlow();

    const roles = new Set(result.events.map((event) => event.actorRole));

    expect(roles.has('programmer')).toBe(true);
    expect(roles.has('project_manager')).toBe(true);
    expect(roles.has('cto')).toBe(true);
    expect(roles.has('ceo')).toBe(true);
    expect(roles.has('cmo')).toBe(true);
    expect(roles.has('cfo')).toBe(true);
    expect(roles.has('accountant')).toBe(true);
    expect(roles.has('sales')).toBe(true);
    expect(roles.has('secretary')).toBe(true);
  });
});
