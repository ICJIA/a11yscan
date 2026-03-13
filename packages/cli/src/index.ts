#!/usr/bin/env node

/**
 * a11yscan — Pattern-aware accessibility auditor CLI.
 * Entry point: routes to direct mode (flag-based) or prints help.
 */

import { createProgram } from './cli/direct.js';

const program = createProgram();

// If no arguments beyond node + script, show help (wizard placeholder for Phase 3)
if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse(process.argv);
}
