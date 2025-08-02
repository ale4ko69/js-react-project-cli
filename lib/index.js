const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const os = require('os');

async function createProject(projectName, options = {}) {
  const targetDir = options.directory || process.cwd();
  const projectPath = path.join(targetDir, projectName);
  const isWindows = os.platform() === 'win32';

  // Check if a folder with this name already exists
  if (fs.existsSync(projectPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${projectName} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Project creation cancelled.'));
      return;
    }

    // Remove existing folder
    fs.rmSync(projectPath, { recursive: true, force: true });
  }

  console.log(chalk.blue(`Creating new project: ${projectName}`));

  // Step 1: Cloning the repository
  const cloneSpinner = ora('Cloning template repository...').start();
  try {
    execSync(
      `git clone https://github.com/ale4ko69/js-react-project.git "${projectPath}"`,
      { stdio: 'pipe' }
    );
    cloneSpinner.succeed('Template repository cloned');
  } catch (error) {
    cloneSpinner.fail('Failed to clone repository');
    throw error;
  }

  // Step 2: Removing .git folder
  const gitSpinner = ora('Removing original git history...').start();
  try {
    const gitPath = path.join(projectPath, '.git');
    if (fs.existsSync(gitPath)) {
      if (isWindows) {
        // On Windows, use rmdir for forced deletion
        execSync(`rmdir /s /q "${gitPath}"`, { stdio: 'pipe' });
      } else {
        fs.rmSync(gitPath, { recursive: true, force: true });
      }
    }
    gitSpinner.succeed('Original git history removed');
  } catch (error) {
    gitSpinner.fail('Failed to remove git history');
    // Try to delete using Node.js API as a fallback
    try {
      const gitPath = path.join(projectPath, '.git');
      if (fs.existsSync(gitPath)) {
        fs.rmSync(gitPath, { recursive: true, force: true });
      }
      gitSpinner.succeed('Original git history removed');
    } catch (fallbackError) {
      console.error('Failed to remove .git folder:', fallbackError);
      throw error;
    }
  }

  // Step 3: Initializing new Git repository
  const initSpinner = ora('Initializing new git repository...').start();
  try {
    process.chdir(projectPath);
    execSync('git init', { stdio: 'pipe' });
    execSync('git add .', { stdio: 'pipe' });
    execSync('git commit -m "Initial commit from template"', { stdio: 'pipe' });
    initSpinner.succeed('New git repository initialized');
  } catch (error) {
    initSpinner.fail('Failed to initialize git repository');
    throw error;
  }

  // Step 4: Installing dependencies
  const installSpinner = ora('Installing dependencies...').start();
  try {
    execSync('npm install', { stdio: 'pipe' });
    installSpinner.succeed('Dependencies installed');
  } catch (error) {
    installSpinner.fail('Failed to install dependencies');
    throw error;
  }

  // Successful completion
  console.log(chalk.green('\n✅ Project created successfully!'));
  console.log(chalk.cyan('\nNext steps:'));
  console.log(chalk.white(`  cd ${projectName}`));
  console.log(chalk.white('  npm run dev'));
  console.log(chalk.gray('\nThis will start the development server at http://localhost:5173'));

  // Optional: ask if the development server should be started immediately
  const { startDev } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startDev',
      message: 'Would you like to start the development server now?',
      default: true
    }
  ]);

  if (startDev) {
    console.log(chalk.blue('\nStarting development server...'));

    // Define the command for Windows
    const command = isWindows ? 'npm.cmd' : 'npm';

    const devProcess = spawn(command, ['run', 'dev'], {
      stdio: 'inherit',
      cwd: projectPath
    });

    // Signal processing for correct termination
    process.on('SIGINT', () => {
      devProcess.kill('SIGINT');
      process.exit(0);
    });
  }
}

module.exports = { createProject };
