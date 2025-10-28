/**
 * Main entry point to start the WhatsApp Multi-Agent Chatbot
 */

import { ChatBot } from './ChatBot';

async function main() {
  const chatBot = new ChatBot();
  
  try {
    console.log('Starting WhatsApp Multi-Agent Chatbot...');
    await chatBot.initialize();
    console.log('ChatBot is running and ready to receive messages!');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\nShutting down ChatBot...');
      await chatBot.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down ChatBot...');
      await chatBot.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start ChatBot:', error);
    process.exit(1);
  }
}

// Start the application
main().catch(console.error);
