"use client";

import { CheckCircle, XCircle, AlertTriangle, FileCode } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SkillkitResultData {
  skillMd: string;
  plan: { name: string; description: string; tools: string[] };
  review: { pass: boolean; issues: string[]; suggestions: string[] };
  validation: { valid: boolean; errors: string[]; warnings: string[] };
  stages?: { stage: string; message: string }[];
}

export function SkillkitResultRenderer({
  data,
}: {
  data: SkillkitResultData;
}) {
  return (
    <div className="space-y-4">
      {/* Review & Validation status */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {data.review.pass ? (
              <CheckCircle className="h-5 w-5 text-green" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="font-medium">
                Review {data.review.pass ? "Passed" : "Failed"}
              </p>
              {data.review.issues.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {data.review.issues.length} issue(s)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {data.validation.valid ? (
              <CheckCircle className="h-5 w-5 text-green" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="font-medium">
                Validation {data.validation.valid ? "Passed" : "Failed"}
              </p>
              {data.validation.warnings.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {data.validation.warnings.length} warning(s)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues & Warnings */}
      {(data.review.issues.length > 0 ||
        data.validation.errors.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.review.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <XCircle className="mt-0.5 h-3 w-3 text-destructive" />
                <span>{issue}</span>
              </div>
            ))}
            {data.validation.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <XCircle className="mt-0.5 h-3 w-3 text-destructive" />
                <span>{err}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.validation.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.validation.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-3 w-3 text-warning" />
                <span>{w}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {data.review.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {data.review.suggestions.map((s, i) => (
                <li key={i}>- {s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* SKILL.md preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCode className="h-4 w-4" />
            Generated SKILL.md
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-lg bg-code-bg p-4 text-sm text-muted-foreground">
            {data.skillMd}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
