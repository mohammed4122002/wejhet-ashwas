"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { usePrefs } from "@/hooks/use-prefs";
import { useRewards } from "@/hooks/use-rewards";
import { REWARD_SYSTEMS } from "@/lib/domain/constants";
import { RewardBadges } from "@/components/app/reward-badges";
import { StarConstellations } from "@/components/app/reward-templates/star-constellations";
import { PalestineMap } from "@/components/app/reward-templates/palestine-map";
import { CityBuilder } from "@/components/app/reward-templates/city-builder";
import { GardenTree } from "@/components/app/reward-templates/garden-tree";
import { Minimal } from "@/components/app/reward-templates/minimal";

export default function RewardsPage() {
  const { rewardSystem } = usePrefs();
  const { progress, badges } = useRewards();

  const label =
    REWARD_SYSTEMS.find((r) => r.value === rewardSystem)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-text-primary">إنجازي</h1>
          <p className="text-body text-text-secondary">
            تقدّمك مربوط بإنجازك الحقيقي فقط — كل درس تتقنه يظهر هنا.
          </p>
        </div>
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-2 rounded-pill border border-strong px-4 py-2 text-secondary text-text-secondary transition-colors hover:text-text-primary"
        >
          <Settings2 className="size-4" aria-hidden />
          القالب: {label}
        </Link>
      </header>

      {rewardSystem === "star_constellations" && <StarConstellations progress={progress} />}
      {rewardSystem === "palestine_map" && <PalestineMap progress={progress} />}
      {rewardSystem === "city_builder" && <CityBuilder progress={progress} />}
      {rewardSystem === "garden_tree" && <GardenTree progress={progress} />}
      {rewardSystem === "minimal" && <Minimal progress={progress} />}

      <RewardBadges badges={badges} />
    </div>
  );
}
