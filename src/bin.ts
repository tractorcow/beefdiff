#!/usr/bin/env node

import { main } from "./app.js";

main().then((exitCode) => {
  process.exit(exitCode);
});
