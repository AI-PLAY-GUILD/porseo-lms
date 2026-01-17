import { TrendingUpIcon, Trophy, Activity, BookOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

interface SectionCardsProps {
  stats: {
    completedCount: number;
    rank: string;
    itemsToNext: number;
    streakDays: number;
    totalVideos: number;
  }
}

export function SectionCards({ stats }: SectionCardsProps) {
  const completionRate = stats.totalVideos > 0 ? Math.round((stats.completedCount / stats.totalVideos) * 100) : 0;

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>学習完了数</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.completedCount} <span className="text-sm font-normal text-muted-foreground">本</span>
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <BookOpen className="size-3" />
              {completionRate}%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            全コンテンツの {completionRate}%
          </div>
          <div className="text-muted-foreground">
            継続して学習を進めましょう
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>現在のランク</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.rank}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <Trophy className="size-3 text-yellow-500" />
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            次のランクまで
          </div>
          <div className="text-muted-foreground">
            あと {stats.itemsToNext} 本の完了が必要です
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>連続学習記録</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {stats.streakDays} <span className="text-sm font-normal text-muted-foreground">日</span>
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <Activity className="size-3 text-green-500" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            素晴らしい継続力です！
          </div>
          <div className="text-muted-foreground">
            毎日少しずつ進めましょう
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
