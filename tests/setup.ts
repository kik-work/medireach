import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Runs before each test file's imports: every worker gets its own throw-away data folder.
process.env.MEDIREACH_DATA_DIR ??= fs.mkdtempSync(path.join(os.tmpdir(), "medireach-test-"));
// The caution phrasing must never call the real API from tests.
delete process.env.ANTHROPIC_API_KEY;
