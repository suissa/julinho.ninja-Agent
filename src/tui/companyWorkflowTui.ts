import readline from 'node:readline';
import { CompanyWorkflow, defaultCompanyTeam } from '../workflow/companyWorkflow';

const workflow = new CompanyWorkflow(defaultCompanyTeam);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const menu = (): void => {
  process.stdout.write('\n=== Company Workflow TUI ===\n');
  process.stdout.write('1) Executar fluxo completo\n');
  process.stdout.write('2) Mostrar equipe\n');
  process.stdout.write('0) Sair\n\n');

  rl.question('Escolha uma opção: ', (answer) => {
    if (answer === '1') {
      const result = workflow.runReleaseFlow();
      process.stdout.write('\n--- TRACES ---\n');
      result.traces.forEach((trace) => process.stdout.write(`#${trace.step} ${trace.label} => ${trace.participants.join(', ')}\n`));
      process.stdout.write('\n--- LOGS ---\n');
      result.logs.forEach((log) => process.stdout.write(`${log}\n`));
      process.stdout.write(`\nTotal de eventos: ${result.events.length}\n`);
      return menu();
    }

    if (answer === '2') {
      process.stdout.write('\n--- EQUIPE ---\n');
      defaultCompanyTeam.forEach((employee) => process.stdout.write(`- ${employee.name} (${employee.role})\n`));
      return menu();
    }

    if (answer === '0') {
      rl.close();
      return;
    }

    process.stdout.write('Opção inválida.\n');
    menu();
  });
};

menu();
