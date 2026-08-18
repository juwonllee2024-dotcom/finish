#!/usr/bin/env node

import { runCli } from "./command.js";

void runCli(process.argv.slice(2), process.cwd()).then((exitCode) => {
  process.exitCode = exitCode;
});
