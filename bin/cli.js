#!/usr/bin/env node

const { program } = require('commander');
const { createProject } = require('../lib/index');

program
  .version('1.0.0')
  .description('Create a new project from js-react-project template')
  .argument('<project-name>', 'name of the project to create')
  .option('-d, --directory <dir>', 'target directory (default: current directory)')
  .action(async (projectName, options) => {
    try {
      await createProject(projectName, options);
    } catch (error) {
      console.error('Error creating project:', error.message);
      process.exit(1);
    }
  });

program.parse();
