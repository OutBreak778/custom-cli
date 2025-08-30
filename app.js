#!/usr/bin/env node
import {
  intro,
  outro,
  isCancel,
  cancel,
  text,
  multiselect,
  spinner,
  log,
  confirm,
} from "@clack/prompts";
import color from "picocolors";
import path from "path";
import { execa } from "execa";
import fse from "fs-extra";

const appJsData = `
import express from "express"
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

app.listen(PORT, () => {
  console.log(\`✅ Server started on http://localhost:\${PORT}\`);
});

process.on("SIGINT", () => {
  console.log("🛑 Caught interrupt signal (Ctrl+C). Closing server...");
  server.close(() => {
    console.log("✅ Server stopped cleanly.");
    process.exit(0);
  });
});
`;

async function main() {
    intro(color.bgCyan(color.black(" Welcome to Nikhil Mishra CLI ")));

  // Ask for folder name
  const folderName = await text({
    message: "📂 Enter your project folder name:",
    placeholder: "my-app",
    validate(value) {
      if (value.length === 0) return "Folder name is required.";
    },
  });
  if (isCancel(folderName)) {
    cancel("❌ Operation cancelled by user.");
    process.exit(0);
  }

  // Ask which subfolders to create
  const selectFolder = await multiselect({
    message: "📦 Select sub-folders to include:",
    options: [
      { value: "src", label: "src" },
      { value: "config", label: "config" },
      { value: "controller", label: "controller", hint: "recommended" },
      { value: "middleware", label: "middleware" },
      { value: "router", label: "router", hint: "recommended" },
      { value: "models", label: "models", hint: "recommended" },
      { value: "utils", label: "utils" },
      { value: "services", label: "services" },
      { value: "validation", label: "validation" },
      { value: "tests", label: "tests" },
      { value: "lib", label: "lib" },
      { value: "public", label: "public" },
      { value: "scripts", label: "scripts" },
      { value: "migration", label: "migration" },
    ],
  });
  if (isCancel(selectFolder)) {
    cancel("❌ Operation cancelled by user.");
    process.exit(0);
  }

  const pathName = path.join(process.cwd(), folderName);
  const s = spinner();

  try {
    s.start("Creating project structure...");
    await fse.mkdirp(pathName.toLowerCase());
    for (const folder of selectFolder) {
      await fse.mkdirp(path.join(pathName, folder).toLowerCase());
    }

    // Write starter app.js
    await fse.writeFile(
      path.join(pathName, "app.js"),
      appJsData.trim(),
      "utf-8"
    );

    s.stop("✅ Project structure created.");

    // Initialize npm & install deps
    const installDeps = await confirm({
      message:
        "Do you want to install dependencies (express, helmet, nodemon)?",
      initialValue: true,
    });
    if (isCancel(installDeps)) {
      cancel("❌ Operation cancelled by user.");
      process.exit(0);
    }

    if (installDeps) {
      s.start("📥 Initializing project...");
      await execa("npm", ["init", "-y"], { cwd: pathName });

      // Modify package.json
      const packageJsonPath = path.join(pathName, "package.json");
      const pkg = await fse.readJson(packageJsonPath);
      pkg.type = "module";
      pkg.scripts = {
        start: "node app.js",
        dev: "nodemon app.js",
      };
      await fse.writeJson(packageJsonPath, pkg, { spaces: 2 });

      // Install dependencies
      s.message("Installing dependencies...");
      await execa("npm", ["i", "express", "helmet", "nodemon"], {
        cwd: pathName,
      });
      s.stop("✅ Dependencies installed.");
    }

    log.success(`🎉 Project '${folderName}' is ready!`);
    log.step("Next steps:");
    console.log(`
      👉 cd ${folderName}
      👉 npm run dev
    `);

    outro(color.green("✨ Setup complete. Happy coding!"));
    } catch(error) {
        console.log(error)
        process.exit(1)
    }
}

await main();
