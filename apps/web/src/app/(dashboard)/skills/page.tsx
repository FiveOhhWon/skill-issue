"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  Pencil,
  Puzzle,
  Package,
  Wrench,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Skill {
  name: string;
  description: string;
  version: string;
  tools: string[];
  composable_with: string[];
}

/** Map tool names to badge variants for visual differentiation */
function toolVariant(
  tool: string
): "default" | "cyan" | "success" | "warning" | "secondary" {
  const t = tool.toLowerCase();
  if (t.includes("search") || t.includes("web")) return "cyan";
  if (t.includes("write") || t.includes("generate")) return "success";
  if (t.includes("analyze") || t.includes("read")) return "warning";
  if (t.includes("api") || t.includes("fetch")) return "default";
  return "secondary";
}

function SkillCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-4/5" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-4 w-16 mb-3" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-2xl bg-secondary p-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No skills found</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {search
          ? `No skills match "${search}". Try a different search term.`
          : "No skills are available yet. Create one to get started."}
      </p>
    </div>
  );
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch("/api/skills/list");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Skill[] = await res.json();
        setSkills(data);
      } catch {
        // fail silently — show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchSkills();
  }, []);

  const filtered = skills.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold gradient-text">Skills</h1>
          {!loading && (
            <Badge variant="secondary">{filtered.length}</Badge>
          )}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkillCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill) => (
            <Card
              key={skill.name}
              className="flex flex-col transition-colors hover:bg-card-hover"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    {skill.name}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    v{skill.version}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {skill.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {/* Tools */}
                {skill.tools.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Tools
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.tools.map((tool) => (
                        <Badge
                          key={tool}
                          variant={toolVariant(tool)}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Composable with */}
                {skill.composable_with && skill.composable_with.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Layers className="h-3 w-3" />
                      Composable with
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.composable_with.map((name) => (
                        <Link
                          key={name}
                          href={`/skills/${name}`}
                          className="inline-flex"
                        >
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 hover:bg-accent cursor-pointer"
                          >
                            <Puzzle className="mr-1 h-2.5 w-2.5" />
                            {name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="gap-2">
                <Button asChild size="sm" variant="default">
                  <Link href={`/skills/${skill.name}`}>
                    <Play className="h-3.5 w-3.5" />
                    Run
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/skills/${skill.name}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
