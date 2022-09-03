/**
 * Run as follows:
 * yarn dev ./example/traverse-nodejs-web.js
 */
import path from 'path';
import main from './index';

// Read config
const configFile = process.argv[2];
if (!configFile) {
  console.log('Usage: yarn code-traverse <configFile>');
  console.log('e.g. yarn code-traverse ./config.js');
  console.log();
  throw new Error('Config file was not given');
}

// Parse config
const resolvedConfigFile = path.join(process.cwd(), configFile);
const rawConfig: Config = require(resolvedConfigFile);
main(rawConfig);
