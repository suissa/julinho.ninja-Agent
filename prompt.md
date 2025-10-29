Quero criar um chatbot via whatsapp multi-agent corografados via dynamic self-routing, onde o agente ativo irá escolher qual o próximo a ser ativado buscando o nome da sua fila na memória do Chatbot, fazendo com que o próximo Agent faça um subribe em 'phone.{telefone passado pelo Agent anterior}', porisso é uma dynamic self-routing, e para isso utilizaremos a lib `sdk-rabbitmq` que facilita o uso de um Singleton de Rabbitmq, iniciando sua intancia com `sdkRabbitmq = await SdkRabbitmq.getInstance();`
As funções que serão necessárias são: publish, subscribe, bind, unbind.

Precisamos criar os seguintes Agents com suas routingKeys:
- PatientNameAgent: routingKey='patient.name'
- PatientCPFAgent: routingKey='patient.cpf'
- PatientEmailAgent: routingKey='patient.email'
- PatientBirthDateAgent: routingKey='patient.birthDate'

Utilizando a seguinte topic exchange: "chatbot.agents"

Essas filas devem ser criadas e feito o `subscribe` de cada agent no start do ChatBot, também deve limpar a memória global do Chatbot antes de iniciar qualquer coisa, depois deve definir o fluxo na memória global: `agentsFlow: [ 'patient.name', 'patient.cpf', 'patient.birthDate', 'patient.email' ]`, é nessa lista que o Agent, que estiver ativo, vem buscar qual é o próximo agent a ser ativado. Sempre deverá pegar a primeira posição dessa lista e retirar esse valor da lista

O primeiro agente GreetingAgent será o início do fluxo sempre ouvindo todas mensagens que chegam no Chatbot, sdkRabbitmq.subscribe('chatbot.messages', 'queue-greeting', 'phone.*') isso irá ouvir as mensagens de todos os telefones. Pois WhatsApp Service irá sempre enviar ('chatbot.messages', 'phone.{numero do whatsapp}')

caso seja a primeira mensagem, verifica a memória global do Chatbot se esse telefone já existe na lista clientes_visitantes, ele irá ser ativado enviando a sua mensagem de Agent("Olá seja bem vindo...") para o WhatsApp desse número, para isso o Agent deve executar sendToWhatsApp(telefone, agentMessage)

async function sendToWhatsApp(telefone, agentMessage) {
  await sdkRabbitmq.publish('whatsapp.message.text', 'send', {number: {telefone}, text: {agentMessage}})
}


Caso o número já exista na memória global o GreetingAgent:
- não processa nada
- faz o ack() dessa mensagem, 
- busca na memória global do chatbot qual é o proximo Agent, com isso pegando o nome da sua fila
- envia um payload {number: {telefone}, sender: {agentName}, timestamp: Date.now()} na fila do próximo Agent, executando sdkRabbitmq.publish('chatbot.agents', '{nome da fila do proximo Agent}', payload)
- espera 5 segundos
- envia a mesma mensagem que recebeu do usuário para a fila "chatbot.messages" + "phone.{payload.number}", 

O próximo Agent sempre fará essa lógica:
- recebe o payload em 'chatbot.agents' + '{nome da sua fila}'
- ao receber esse payload ele precisa fazer um subscribe na routingKey do telefone do usuário, sdkRabbitmq.subscribe('chatbot.messages', 'phone.{payload.number}')
- faz um publish com a sua messagem de Agent para o WhatsApp do usuário sendToWhatsApp(payload.number, agentMessage)
- espera a resposta do usuário com o valor a ser processado
- após processar(pegar a informação)
- busca na memória global do chatbot qual é o proximo Agent, com isso pegando o nome da sua fila
- envia um payload {number: {telefone}, sender: {agentName}, timestamp: Date.now()} na fila do próximo Agent, executando sdkRabbitmq.publish('chatbot.agents', '{nome da fila do proximo Agent}', payload)
- espera 5 segundos
- envia a mesma mensagem que recebeu do usuário para a fila "chatbot.messages" + "phone.{payload.number}", 

E pronto essa é a lógica que todos os Agents devem executar.

Vamos inicialmente criar algo simples, porém que funione todo o fluxo de forma dinâmica
