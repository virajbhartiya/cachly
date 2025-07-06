#!/usr/bin/env node

import { Cachly } from './Cachly';
import { FSAdapter } from './adapters/FSAdapter';
import * as readline from 'readline';

interface CLICommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<void>;
}

class CachlyCLI {
  private cache: Cachly;
  private rl: readline.Interface;

  constructor() {
    this.cache = new Cachly({
      persistence: new FSAdapter('./.cachly'),
      log: true,
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private commands: CLICommand[] = [
    {
      name: 'get',
      description: 'Get a value from cache',
      usage: 'get <key>',
      execute: async (args) => {
        if (args.length < 1) {
          console.log('Usage: get <key>');
          return;
        }
        const value = await this.cache.get(args[0] || '');
        console.log(value ? JSON.stringify(value, null, 2) : 'Not found');
      },
    },
    {
      name: 'set',
      description: 'Set a value in cache',
      usage: 'set <key> <value> [ttl]',
      execute: async (args) => {
        if (args.length < 2) {
          console.log('Usage: set <key> <value> [ttl]');
          return;
        }
        const ttl = args[2] ? parseInt(args[2]) : undefined;
        await this.cache.set(args[0] || '', args[1] || '', { ttl });
        console.log('Value set successfully');
      },
    },
    {
      name: 'delete',
      description: 'Delete a key from cache',
      usage: 'delete <key>',
      execute: async (args) => {
        if (args.length < 1) {
          console.log('Usage: delete <key>');
          return;
        }
        this.cache.delete(args[0] || '');
        console.log('Key deleted successfully');
      },
    },
    {
      name: 'stats',
      description: 'Show cache statistics',
      usage: 'stats',
      execute: async () => {
        const stats = this.cache.stats();
        console.log('Cache Statistics:');
        console.log(JSON.stringify(stats, null, 2));
      },
    },
    {
      name: 'keys',
      description: 'List all keys in cache',
      usage: 'keys [pattern]',
      execute: async (args) => {
        const pattern = args[0];
        const keys = this.cache.getKeys(pattern);
        console.log(`Found ${keys.length} keys:`);
        keys.forEach(key => console.log(`  ${key}`));
      },
    },
    {
      name: 'top',
      description: 'Show top accessed keys',
      usage: 'top [limit]',
      execute: async (args) => {
        const limit = args[0] ? parseInt(args[0]) : 10;
        const topKeys = this.cache.getTopKeys(limit);
        console.log(`Top ${limit} accessed keys:`);
        topKeys.forEach((item, index) => {
          console.log(`${index + 1}. ${item.key} (${item.accessCount} accesses)`);
        });
      },
    },
    {
      name: 'tags',
      description: 'List all tags',
      usage: 'tags',
      execute: async () => {
        // This would need to be implemented in the cache class
        console.log('Tags feature not yet implemented in CLI');
      },
    },
    {
      name: 'clear',
      description: 'Clear all cache',
      usage: 'clear',
      execute: async () => {
        this.cache.clear();
        console.log('Cache cleared successfully');
      },
    },
    {
      name: 'health',
      description: 'Show cache health status',
      usage: 'health',
      execute: async () => {
        const health = this.cache.health();
        console.log('Cache Health:');
        console.log(JSON.stringify(health, null, 2));
      },
    },
    {
      name: 'help',
      description: 'Show this help message',
      usage: 'help',
      execute: async () => {
        console.log('Available commands:');
        this.commands.forEach(cmd => {
          console.log(`  ${cmd.name.padEnd(10)} - ${cmd.description}`);
          console.log(`    Usage: ${cmd.usage}`);
        });
      },
    },
    {
      name: 'exit',
      description: 'Exit the CLI',
      usage: 'exit',
      execute: async () => {
        this.cache.destroy();
        this.rl.close();
        process.exit(0);
      },
    },
  ];

  async start(): Promise<void> {
    console.log('Cachly CLI - Type "help" for available commands');
    
    const askQuestion = (): Promise<string> => {
      return new Promise((resolve) => {
        this.rl.question('cachly> ', resolve);
      });
    };

    while (true) {
      try {
        const input = await askQuestion();
        const [command, ...args] = input.trim().split(' ');
        
        if (!command) continue;

        const cmd = this.commands.find(c => c.name === command);
        if (cmd) {
          await cmd.execute(args);
        } else {
          console.log(`Unknown command: ${command}. Type "help" for available commands.`);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
}

// Start CLI if this file is run directly
if (require.main === module) {
  const cli = new CachlyCLI();
  cli.start().catch(console.error);
}

export { CachlyCLI }; 