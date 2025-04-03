#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('my-binary')
  .description('A CLI tool for your application')
  .version('1.0.0');

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log('Hello from your binary!');
  });

program.parse(process.argv);

// console.log(program.args);
// console.log(program.opts());
// console.log(program.commands);
console.log('Running a CLI tool for your application' );