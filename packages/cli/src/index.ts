#!/usr/bin/env node

/**
 * a11yscan — Pattern-aware accessibility auditor CLI.
 * Entry point: routes to direct mode (flag-based) or prints help.
 */

import { createProgram } from './cli/direct.js';

const program = createProgram();
program.parse(process.argv);
