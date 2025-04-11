#!/usr/bin/env node

/**
 * Script to create a new TypeORM migration file with the correct format
 * Usage: node create-migration.mjs MyMigrationName
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Please provide a migration name");
  console.error("Usage: node create-migration.mjs MyMigrationName");
  process.exit(1);
}

// Format the class name to be CamelCase
const className = migrationName
  .replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase())
  .replace(/^\w/, (c) => c.toUpperCase());

const timestamp = Date.now().toString();
const filename = `${timestamp}-${migrationName}.ts`;
const storageDir = path.resolve(__dirname, "..", "storage");
const migrationsDir = path.join(storageDir, "migrations");
const targetFile = path.join(migrationsDir, filename);

// Make sure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const template = `import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
} from "typeorm";

/**
 * ${migrationName} migration
 */
export class ${className}${timestamp} implements MigrationInterface {
  name = "${className}${timestamp}";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Implement migration changes here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Implement rollback logic here
  }
}
`;

fs.writeFileSync(targetFile, template);
console.log(`Created migration file: ${targetFile}`);

// Update the data-source.ts file to import the new migration
const dataSourcePath = path.join(storageDir, "data-source.ts");
const dataSourceContent = fs.readFileSync(dataSourcePath, "utf8");

// Extract all existing migration imports
const importRegex =
  /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']\.\/migrations\/[^"']+["'];/g;
const importMatches = [...dataSourceContent.matchAll(importRegex)];
const existingImports = importMatches.map((match) => match[1].trim());

// Extract migrations array
const migrationsArrayRegex = /migrations:\s*\[\s*([^\]]+)\s*\]/;
const migrationsArrayMatch = dataSourceContent.match(migrationsArrayRegex);
const existingMigrationsList = migrationsArrayMatch
  ? migrationsArrayMatch[1].trim()
  : "";

// Check if data-source.ts has the correct database field setup
const databaseFieldRegex = /database:\s*["'](.*)["']/;
const databaseFieldMatch = dataSourceContent.match(databaseFieldRegex);
if (databaseFieldMatch && databaseFieldMatch[1] !== "") {
  console.warn(
    "Warning: database path in data-source.ts should be empty string. The actual path should be set at runtime in database-manager.ts"
  );
}

// Add new import
const newImport = `import { ${className}${timestamp} } from "./migrations/${filename.replace(".ts", "")}";`;
const newImportsSection =
  importMatches.length > 0
    ? dataSourceContent.replace(
        importRegex,
        (match) => `${match}\n${newImport}`
      )
    : dataSourceContent.replace(
        "// Explicitly import migration classes",
        `// Explicitly import migration classes\n${newImport}`
      );

// Add to migrations array
const newMigrationsArray = `migrations: [${existingMigrationsList ? `${existingMigrationsList}, ` : ""}${className}${timestamp}]`;
const updatedDataSource = newImportsSection.replace(
  migrationsArrayRegex,
  (match) =>
    match.replace(
      /\[\s*([^\]]+)\s*\]/,
      `[${existingMigrationsList ? `${existingMigrationsList}, ` : ""}${className}${timestamp}]`
    )
);

fs.writeFileSync(dataSourcePath, updatedDataSource);
console.log(`Updated data-source.ts with the new migration`);

console.log(
  `\nNow implement your migration logic in the 'up' and 'down' methods.`
);
