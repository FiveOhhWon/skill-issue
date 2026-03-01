#!/usr/bin/env node

/**
 * Skillkit CLI entry point.
 * Generates agentskills.io-compliant SKILL.md files from natural language descriptions.
 */

import { Command } from "commander";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { forge, type ForgeStage } from "./forge.js";

const STAGE_LABELS: Record<ForgeStage, string> = {
  planning: "Planning",
  writing: "Writing",
  reviewing: "Reviewing",
  validating: "Validating",
};

function stageIndicator(current: ForgeStage): string {
  const stages: ForgeStage[] = [
    "planning",
    "writing",
    "reviewing",
    "validating",
  ];
  return stages
    .map((s) => {
      const label = STAGE_LABELS[s];
      if (s === current) return `> ${label}`;
      if (stages.indexOf(s) < stages.indexOf(current)) return `  ${label} [done]`;
      return `  ${label}`;
    })
    .join("\n");
}

const program = new Command();

program
  .name("skillkit")
  .description("Generate agentskills.io-compliant skills from descriptions")
  .version("1.0.0")
  .requiredOption("--describe <description>", "Natural language skill description")
  .requiredOption("--name <name>", "Kebab-case skill name")
  .option(
    "--output-dir <dir>",
    "Output directory",
    "./.claude/skills",
  )
  .action(async (opts: { describe: string; name: string; outputDir: string }) => {
    const { describe, name, outputDir } = opts;

    console.log(`\nSkillkit: Generating skill "${name}"\n`);

    try {
      const result = await forge(name, describe, (progress) => {
        console.log(`\n${stageIndicator(progress.stage)}`);
        console.log(`\n  ${progress.message}\n`);
      });

      // Report results
      console.log("\n--- Generation Complete ---\n");

      if (result.review.pass) {
        console.log("Review: PASSED");
      } else {
        console.log("Review: FAILED");
        for (const issue of result.review.issues) {
          console.log(`  - ${issue}`);
        }
      }

      if (result.review.suggestions.length > 0) {
        console.log("Suggestions:");
        for (const suggestion of result.review.suggestions) {
          console.log(`  - ${suggestion}`);
        }
      }

      if (result.validation.valid) {
        console.log("Validation: PASSED");
      } else {
        console.log("Validation: FAILED");
        for (const error of result.validation.errors) {
          console.log(`  - ${error}`);
        }
      }

      if (result.validation.warnings.length > 0) {
        console.log("Warnings:");
        for (const warning of result.validation.warnings) {
          console.log(`  - ${warning}`);
        }
      }

      // Exit with error if validation failed
      if (!result.validation.valid) {
        process.exit(1);
      }

      // Write SKILL.md only after the output passes validation.
      const skillDir = resolve(outputDir, name);
      if (!existsSync(skillDir)) {
        mkdirSync(skillDir, { recursive: true });
      }
      const skillPath = join(skillDir, "SKILL.md");
      writeFileSync(skillPath, result.skillMd, "utf-8");
      console.log(`Skill written to: ${skillPath}`);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program.parse();
