/**
 * Testes de roteamento na exchange 'agents'
 * - Match exato (patient.name, patient.cpf)
 * - Wildcard 'agent.msg.*' (agent.msg.{number})
 * Ambiente: Jest (ts-jest)
 */

type MessageCallback = (msg: any) => Promise<void> | void;

class InMemoryBroker {
  private handlers: Map<string, MessageCallback[]> = new Map();

  private key(exchange: string, routingKey: string) {
    return `${exchange}::${routingKey}`;
  }

  async subscribe(exchange: string, _queue: string, routingKey: string, cb: MessageCallback) {
    const k = this.key(exchange, routingKey);
    const arr = this.handlers.get(k) || [];
    arr.push(cb);
    this.handlers.set(k, arr);
  }

  async publish(exchange: string, routingKey: string, message: object) {
    // 1) Match exato
    const exact = this.handlers.get(this.key(exchange, routingKey)) || [];
    for (const cb of exact) await Promise.resolve(cb(message));

    // 2) Wildcards simples
    for (const [k, cbs] of this.handlers.entries()) {
      const [ex, patternRaw] = k.split('::');
      const pattern = patternRaw || '';
      if (ex !== exchange) continue;

      // '#' (catch-all)
      if (pattern === '#') {
        for (const cb of cbs) await Promise.resolve(cb(message));
        continue;
      }

      // sufixo '.*' → prefix match
      if (pattern.endsWith('.*')) {
        const prefix = pattern.slice(0, -2);
        if (routingKey.startsWith(prefix)) {
          for (const cb of cbs) await Promise.resolve(cb(message));
        }
      }
    }
  }
}

describe("Exchange 'agents' - roteamento por routing key", () => {
  let bus: InMemoryBroker;

  beforeEach(() => {
    bus = new InMemoryBroker();
  });

  test("entrega ativação para subscriber de 'patient.name'", async () => {
    const onActivation = jest.fn();
    await bus.subscribe('agents', 'patient-name-agent-queue', 'patient.name', onActivation);

    const payload = { number: '5515991111111', sender: 'GreetingAgent', timestamp: 1700000000 };
    await bus.publish('agents', 'patient.name', payload);

    expect(onActivation).toHaveBeenCalledTimes(1);
    expect(onActivation).toHaveBeenCalledWith(payload);
  });

  test("não entrega para subscriber de 'patient.cpf' quando publish é 'patient.name'", async () => {
    const onCpf = jest.fn();
    await bus.subscribe('agents', 'patient-cpf-agent-queue', 'patient.cpf', onCpf);

    await bus.publish('agents', 'patient.name', { ok: true });

    expect(onCpf).not.toHaveBeenCalled();
  });

  test("entrega mensagem do usuário para wildcard 'agent.msg.*'", async () => {
    const onUserMsg = jest.fn();
    // fila única por agente ouvindo wildcards
    await bus.subscribe('agents', 'agent-msg-PatientNameAgent', 'agent.msg.*', onUserMsg);

    const userMsg = { number: '5515992222222', text: 'Meu nome é Fulano', correlationId: 'abc', timestamp: 1700000001 };
    await bus.publish('agents', `agent.msg.${userMsg.number}`, userMsg);

    expect(onUserMsg).toHaveBeenCalledTimes(1);
    expect(onUserMsg).toHaveBeenCalledWith(userMsg);
  });

  test("não entrega wildcard quando prefixo não bate", async () => {
    const onUserMsg = jest.fn();
    await bus.subscribe('agents', 'agent-msg-PatientNameAgent', 'agent.msg.*', onUserMsg);

    await bus.publish('agents', 'user.msg.5515993333333', { nope: true });

    expect(onUserMsg).not.toHaveBeenCalled();
  });
});