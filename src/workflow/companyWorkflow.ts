export type Role =
  | 'programmer'
  | 'project_manager'
  | 'cto'
  | 'ceo'
  | 'cmo'
  | 'cfo'
  | 'accountant'
  | 'sales'
  | 'secretary';

export interface Employee {
  id: string;
  name: string;
  role: Role;
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: Role;
  action: string;
  details: string;
}

export interface WorkflowTrace {
  step: number;
  label: string;
  participants: string[];
}

export interface WorkflowRunResult {
  logs: string[];
  traces: WorkflowTrace[];
  events: WorkflowEvent[];
}

export class CompanyWorkflow {
  constructor(private readonly employees: Employee[]) {}

  public runReleaseFlow(): WorkflowRunResult {
    const events: WorkflowEvent[] = [];
    const traces: WorkflowTrace[] = [];
    const logs: string[] = [];

    const step = (label: string, participants: Role[], action: string, details: string): void => {
      const matched = this.employees.filter((employee) => participants.includes(employee.role));
      traces.push({
        step: traces.length + 1,
        label,
        participants: matched.map((employee) => employee.name)
      });

      matched.forEach((employee) => {
        const event: WorkflowEvent = {
          id: `${events.length + 1}`,
          timestamp: new Date().toISOString(),
          actorId: employee.id,
          actorRole: employee.role,
          action,
          details
        };
        events.push(event);
        logs.push(`[${event.timestamp}] ${employee.name} (${employee.role}) => ${action}: ${details}`);
      });
    };

    step('Refinement and planning', ['project_manager', 'ceo', 'cto'], 'plan_sprint', 'Sprint goals, scope and architecture validated.');
    step('Development', ['programmer'], 'implement_feature', 'Core product backlog implemented by engineering squad.');
    step('Go-to-market prep', ['cmo', 'sales'], 'prepare_launch', 'Campaign assets and sales scripts ready.');
    step('Finance and compliance', ['cfo', 'accountant'], 'financial_review', 'Budget, invoices and tax impact reviewed.');
    step('Client communication', ['secretary', 'sales'], 'client_follow_up', 'Clients informed and onboarding scheduled.');
    step('Executive approval', ['ceo'], 'approve_release', 'Final production release approved.');

    return { logs, traces, events };
  }
}

export const defaultCompanyTeam: Employee[] = [
  { id: 'dev-1', name: 'Programador 1', role: 'programmer' },
  { id: 'dev-2', name: 'Programador 2', role: 'programmer' },
  { id: 'dev-3', name: 'Programador 3', role: 'programmer' },
  { id: 'pm-1', name: 'Gerente de Projeto', role: 'project_manager' },
  { id: 'cto-1', name: 'CTO', role: 'cto' },
  { id: 'ceo-1', name: 'CEO', role: 'ceo' },
  { id: 'cmo-1', name: 'CMO', role: 'cmo' },
  { id: 'cfo-1', name: 'CFO', role: 'cfo' },
  { id: 'acc-1', name: 'Contador', role: 'accountant' },
  { id: 'sales-1', name: 'Vendedor 1', role: 'sales' },
  { id: 'sales-2', name: 'Vendedor 2', role: 'sales' },
  { id: 'sec-1', name: 'Secretária', role: 'secretary' }
];
